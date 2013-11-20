# -*- coding: utf-8 -*-
"""
Created on Sat Oct 12 22:32:16 2013

@author: xm
"""

from __future__ import division

cimport cython
from libc.stdlib cimport malloc, free, rand

cdef struct SkipNode:
    int height
    int index
    float value
    SkipNode** next

ctypedef SkipNode* SkipNode_t

cdef int MAX_HEIGHT = 100

cdef SkipNode* newSkipNode(int height, int index, float value):
    #height > 0
    cdef SkipNode* sn = <SkipNode*>malloc(cython.sizeof(SkipNode))
    cdef int i
    if sn is NULL:
        raise MemoryError()
    sn.height = height
    sn.index = index
    sn.value = value
    sn.next = <SkipNode**>malloc(cython.sizeof(SkipNode_t) * height)
    if sn.next is NULL:
        raise MemoryError()
    for i in xrange(height):
        sn.next[i] = NULL
    return sn

cdef int sizeof(SkipNode* sn):
    return cython.sizeof(SkipNode) + cython.sizeof(SkipNode_t) * sn.height

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

cdef int randomHeight():
    cdef int height = 1
    while rand() & 1:
        height += 1
    if height > MAX_HEIGHT:
        return MAX_HEIGHT
    else:
        return height

cdef class SparseSkipList(object):
    cpdef public int height
    cpdef public int size
    cpdef public int memory
    cdef SkipNode* head
    cdef SkipNode** found
    
    def __init__(self):
        self.size = 0
        self.head = newSkipNode(MAX_HEIGHT, -1, -1)
        self.found = <SkipNode**>malloc(MAX_HEIGHT * cython.sizeof(SkipNode_t))
        cdef int i
        if self.found is NULL:
            raise MemoryError()
        for i in xrange(MAX_HEIGHT):
            self.found[i] = self.head
        self.memory = MAX_HEIGHT * cython.sizeof(SkipNode_t) + sizeof(self.head)
    
    def __del__(self):
        delSkipList(self.head)
        if self.found is not NULL:
            free(self.found)
        
    def __setitem__(self, key, value):
        self.upsert(key, value)
    
    def __getitem__(self, key):
        return self.find(key)
    
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
                result += curr1.value * curr2.value
                curr1 = curr1.next[0]
                curr2 = curr2.next[0]
            elif curr1.index < curr2.index:
                curr1 = self.jumpTo(curr1, curr2.index)
            else:
                curr2 = other.jumpTo(curr2, curr1.index)
        return result
    
    cdef upsert(self, int index, float value):
        cdef SkipNode* candidate
        cdef int newHeight
        cdef int i
        if value == 0:
            return
        self.updateList(index)
        if self.found[0] is not NULL:
            candidate = self.found[0].next[0]
            if candidate != NULL and candidate.index == index:
                candidate.value = value
                # found and updated
                return
        # insert a new node
        newHeight = randomHeight()
        candidate = newSkipNode(newHeight, index, value)
        for i in xrange(newHeight):
            candidate.next[i] = self.found[i].next[i]
            self.found[i].next[i] = candidate
        if newHeight > self.height: 
            self.height = newHeight
        self.size += 1
        self.memory += sizeof(candidate)

    cdef float find(self, int index):
        self.updateList(index)
        cdef SkipNode* candidate
        if self.found[0] is not NULL:
            candidate = self.found[0].next[0]
            if candidate != NULL and candidate.index == index:
                return candidate.value
        return 0
    
    def contains(self, index):
        return self.find(index) != 0

    cdef inline updateList(self, int index):
        cdef int i
        cdef SkipNode* curr = self.getHead()
        for i in reversed(xrange(self.height)):
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
#                    self.MAX_HEIGHT -= 1
#            self.len -= 1
                
#    def printList(self):
#        for i in range(len(self.head.next)-1, -1, -1):
#            x = self.head
#            while x.next[i] != None:
#                print x.next[i].elem,
#                x = x.next[i]
#            print ''    