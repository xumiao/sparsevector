# -*- coding: utf-8 -*-
"""
Created on Sat Oct 12 22:32:16 2013

@author: xm
"""

from __future__ import division

cimport cython
from libc.stdlib cimport malloc, free, rand, calloc, RAND_MAX

cdef int MAX_HEIGHT = 100
cdef int ARRAY_LENGTH = 64

cdef struct SkipNodeA:
    int height
    long long index
    int length
    float* values
    SkipNodeA** next

ctypedef SkipNodeA* SkipNodeA_t

cdef inline MEM_CHECK(void* p):
    if p is NULL:
        raise MemoryError()

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef inline SkipNodeA* NEW_SKIPNODEP():
    cdef SkipNodeA* p = <SkipNodeA*>malloc(cython.sizeof(SkipNodeA))
    MEM_CHECK(p)
    return p
    
@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef inline SkipNodeA** NEW_SKIPNODES(int num, SkipNodeA* target):
    cdef SkipNodeA** p = <SkipNodeA**>malloc(cython.sizeof(SkipNodeA_t) * num)
    MEM_CHECK(p)
    cdef int i
    for i in xrange(num):
        p[i] = target
    return p

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef inline bint SET_VALUE(SkipNodeA* sn, long long index, float value):
    if sn is NULL:
        return False
        
    cdef long long relative_index = index - sn.index
    if relative_index >= 0 and relative_index < sn.length:
        sn.values[relative_index] = value
        return True
    else:
        return False

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef inline float GET_VALUE(SkipNodeA* sn, long long index):
    if sn is NULL:
        return 0
    
    cdef long long relative_index = index - sn.index
    if relative_index >= 0 and relative_index < sn.length:
        return sn.values[relative_index]
    else:
        return 0

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)
cdef inline float DOT(SkipNodeA* sn1, SkipNodeA* sn2, int length):
    cdef float result = 0
    cdef int i = 0
    for i in xrange(length):
       result += sn1.values[i] * sn2.values[i]
    return result

@cython.boundscheck(False)
@cython.wraparound(False)
@cython.nonecheck(False)    
cdef SkipNodeA* newSkipNodeA(int height, long long index, float value, int length):
    #height > 0
    cdef SkipNodeA* sn = NEW_SKIPNODEP()
    sn.height = height
    sn.length = length
    sn.index  = -1
    if length > 0:
        sn.index  = long(index / length) * length # make it multiples of length
        sn.values = <float*>calloc(sn.length, cython.sizeof(float))
        MEM_CHECK(sn.values)
        SET_VALUE(sn, index, value)
    else:
        sn.values = NULL
    sn.next = NEW_SKIPNODES(height, NULL)
    return sn

cdef long long sizeofSN(SkipNodeA* sn):
    return cython.sizeof(SkipNodeA) +\
           cython.sizeof(SkipNodeA_t) * sn.height +\
           sn.length * cython.sizeof(float)

cdef void delSkipNodeA(SkipNodeA* sn):
    if (sn is not NULL):
        if (sn.values is not NULL):
            free(sn.values)
        if (sn.next is not NULL):
            free(sn.next)
        free(sn)

cdef void delSkipList(SkipNodeA* head):
    cdef SkipNodeA* curr = head
    cdef SkipNodeA* next = head
    while(curr is not NULL):
        next = curr.next[0]
        delSkipNodeA(curr)
        curr = next

cdef class SparseSkipListArray(object):
    cpdef public int height
    cpdef public long long size
    cpdef public long long memory
    cdef SkipNodeA* head
    cdef SkipNodeA** found
    cdef int arrayLength
    
    def __init__(self, arrayLength = ARRAY_LENGTH, *arguments, **keywords):
        self.size        = 0
        self.height      = 0
        self.arrayLength = arrayLength
        self.head        = newSkipNodeA(MAX_HEIGHT, -1, -1, 0)
        self.found       = NEW_SKIPNODES(MAX_HEIGHT, self.head)    
        self.memory      = MAX_HEIGHT * cython.sizeof(SkipNodeA_t) + sizeofSN(self.head)
        
    def __dealloc__(self):
        delSkipList(self.head)
        if self.found is not NULL:
            free(self.found)
        
    def __setitem__(self, key, value):
        self.upsert(key, value)
    
    def __getitem__(self, key):
        return self.find(key)
    
    def memorySize(self):
        return self.memory
    
    def add(self, other, w):
        pass

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)    
    cdef int randomHeight(self):
        cdef int height = 1
        while rand() & 1:
            height += 1
        if height > MAX_HEIGHT:
            height = MAX_HEIGHT
        if height > self.height: 
            self.height = height
        return height
        
    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)        
    cdef inline SkipNodeA* jumpTo(self, SkipNodeA* curr, long long target):
        return curr.next[0]

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)        
    cpdef float dot(self, SparseSkipListArray other):
        cdef SkipNodeA* curr1 = self.head.next[0]
        cdef SkipNodeA* curr2 = other.head.next[0]
        cdef float result = 0.0
        while curr1 is not NULL and curr2 is not NULL:
            if curr1.index == curr2.index:
                result += DOT(curr1, curr2, self.arrayLength)
                curr1 = curr1.next[0]
                curr2 = curr2.next[0]
            elif curr1.index < curr2.index:
                curr1 = self.jumpTo(curr1, curr2.index)
            else:
                curr2 = other.jumpTo(curr2, curr1.index)
        return result
    
    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)
    cdef upsert(self, long long index, float value):
        cdef int newHeight
        cdef int i
        cdef SkipNodeA* candidate
        if not self.updateList(index) or not SET_VALUE(self.found[0].next[0], index, value):
            newHeight = self.randomHeight()
            candidate = newSkipNodeA(newHeight, index, value, self.arrayLength)
            for i in xrange(newHeight):
                candidate.next[i] = self.found[i].next[i]
                self.found[i].next[i] = candidate
            self.size += 1
            self.memory += sizeofSN(candidate)

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)        
    cdef float find(self, long long index):
        if self.updateList(index):
            return GET_VALUE(self.found[0].next[0], index)
        else:
            return 0
    
    def contains(self, index):
        return self.find(index) != 0
    
    def __repr__(self):
        a = []
        cdef SkipNodeA* curr = self.head
        cdef i
        while curr.next[0] != NULL:
            curr = curr.next[0]
            a.append('(' + repr(curr.index) + ')')
            for i in xrange(curr.length):
                if curr.values[i] != 0:
                    a.append(':'.join([repr(i + curr.index), repr(curr.values[i])]))
        return ' '.join(a)
        
    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.nonecheck(False)        
    cdef bint updateList(self, long long index):
        cdef int i
        cdef SkipNodeA* curr = self.head
        for i in reversed(xrange(self.height)):
            while curr.next[i] != NULL and curr.next[i].index + curr.next[i].length <= index:
                curr = curr.next[i]
            self.found[i] = curr
        return self.found[0] is not NULL
        
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
#                prlong long x.next[i].elem,
#                x = x.next[i]
#            prlong long ''    