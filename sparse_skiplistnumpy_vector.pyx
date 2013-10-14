# -*- coding: utf-8 -*-
"""
Created on Sat Oct 12 22:32:16 2013

@author: xm
"""

from __future__ import division

import numpy as np
cimport numpy as np
cimport cython
from libc.stdlib cimport malloc, free

cdef struct SkipNode:
    int height
    int index
    int bufferIndex
    SkipNode** next

ctypedef SkipNode* SkipNode_t

cdef SkipNode* newSkipNode(int height, int index, int bufferIndex):
    #height > 0
    cdef SkipNode* sn = <SkipNode*>malloc(cython.sizeof(SkipNode))
    cdef int i
    if sn is NULL:
        raise MemoryError()
    sn.height = height
    sn.index = index
    sn.bufferIndex = bufferIndex
    sn.next = <SkipNode**>malloc(cython.sizeof(SkipNode_t) * height)
    if sn.next is NULL:
        raise MemoryError()
    for i in range(height):
        sn.next[i] = NULL
    return sn
    
cdef void delSkipNode(SkipNode* sn):
    if (sn is not NULL):
        if (sn.next is not NULL):
            free(sn.next)
        free(sn)

cdef void delSkipList(SkipNode* head):
    cdef SkipNode* curr = head
    cdef SkipNode* next = head
    while(curr is not NULL):
        next = curr.next[0]
        delSkipNode(curr)
        curr = next

cdef void delSkipNodeArray(SkipNode_t* a):
    free(a)
    
cdef int randomHeight(int MaxHeight):
    cdef int height = 1
    while np.random.randint(1, 2) != 1:
        height += 1
    if height > MaxHeight:
        return MaxHeight
    else:
        return height
    
cdef class SparseSkipList(object):
    cpdef public int MaxHeight
    cpdef public int ArraySize
    cpdef public int height
    cpdef public int size
    cpdef public int memory
    cdef public list arrayBuffer
    cdef int ArrayMemorySize
    cdef SkipNode* head
    cdef SkipNode** found
    
    def __init__(self, arraySize = 1000, maxHeight = 100):
        self.MaxHeight = maxHeight
        self.ArraySize = arraySize
        self.ArrayMemorySize = cython.sizeof(float) * self.ArraySize
        self.size = 0
        self.head = newSkipNode(self.MaxHeight, -1, -1)
        self.arrayBuffer = list()
        self.found = <SkipNode**>malloc(self.MaxHeight * cython.sizeof(SkipNode_t))
        cdef int i
        if self.found is NULL:
            raise MemoryError()
        for i in range(self.MaxHeight):
            self.found[i] = self.head
        self.memory = 2 * self.MaxHeight * cython.sizeof(SkipNode_t)
    
    def __del__(self):
        delSkipList(self.head)
        if self.found is not NULL:
            delSkipNodeArray(self.found)
        
    def __setitem__(self, key, value):
        cdef int index = key / self.ArraySize
        cdef int offset = key - index * self.ArraySize
        cdef np.ndarray data = self.find(index, insert=1)
        data[offset] = value
    
    def __getitem__(self, key):
        cdef int index = key / self.ArraySize
        cdef int offset = key - index * self.ArraySize
        cdef np.ndarray data = self.find(index, insert=0)
        if data is not None:
            return data[offset]
        else:
            return 0.0
    
    cdef SkipNode* getHead(self):
        return self.head
            
    def memorySize(self):
        return self.memory
    
    def add(self, other, w):
        pass
    
    cdef inline SkipNode* jumpTo(self, SkipNode* curr, int target):
        return curr.next[0]
        
    cpdef float dot(self, SparseSkipList other):
        cdef SkipNode* curr1 = self.getHead().next[0]
        cdef SkipNode* curr2 = other.getHead().next[0]
        cdef float result = 0.0
        while curr1 is not NULL and curr2 is not NULL:
            if curr1.index == curr2.index:
                result += np.dot(self.arrayBuffer[curr1.bufferIndex], other.arrayBuffer[curr2.bufferIndex])
                curr1 = curr1.next[0]
                curr2 = curr2.next[0]
            elif curr1.index < curr2.index:
                curr1 = self.jumpTo(curr1, curr2.index)
            else:
                curr2 = other.jumpTo(curr2, curr1.index)
        return result
        
    cdef np.ndarray find(self, int index, int insert = 1):
        self.updateList(index)
        cdef SkipNode* candidate
        cdef int newHeight
        cdef int i
        if self.found[0] is not NULL:
            candidate = self.found[0].next[0]
            if candidate != NULL and candidate.index == index:
                return self.arrayBuffer[candidate.bufferIndex]
        if insert is not 0:
            newHeight = randomHeight(self.MaxHeight)
            self.arrayBuffer.append(np.zeros(self.ArraySize, dtype=float))
            candidate = newSkipNode(newHeight, index, self.size)
            for i in range(newHeight):
                candidate.next[i] = self.found[i].next[i]
                self.found[i].next[i] = candidate
            if newHeight > self.height: 
                self.height = newHeight
            self.size += 1
            self.memory += newHeight * cython.sizeof(SkipNode_t) + self.ArrayMemorySize
            return self.arrayBuffer[candidate.bufferIndex]
        return None
    
    def contains(self, index):
        cdef int i = index
        return self.find(i, insert=0) != None

    cdef updateList(self, int index):
        cdef int i
        cdef SkipNode* curr = self.getHead()
        for i in reversed(range(self.height)):
            while curr.next[i] != NULL and curr.next[i].index < index:
                curr = curr.next[i]
            self.found[i] = curr
        
#    def remove(self, elem):
#        update = self.updateList(elem)
#        x = self.find(elem, update)
#        if x != None:
#            for i in reversed(range(len(x.next))):
#                update[i].next[i] = x.next[i]
#                if self.head.next[i] == None:
#                    self.maxHeight -= 1
#            self.len -= 1
                
#    def printList(self):
#        for i in range(len(self.head.next)-1, -1, -1):
#            x = self.head
#            while x.next[i] != None:
#                print x.next[i].elem,
#                x = x.next[i]
#            print ''    