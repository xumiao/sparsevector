# -*- coding: utf-8 -*-
"""
Created on Sat Oct 12 22:32:16 2013

@author: xm
"""
#cython: boundscheck=False
#cython: wraparound=False

from __future__ import division

cimport cython
from libc.stdlib cimport malloc, free, rand, calloc, RAND_MAX

cdef int MAX_HEIGHT = 100
cdef int ARRAY_LENGTH = 16

cdef struct SkipNodeA:
    int height
    long long index
    int length
    float* values
    SkipNodeA** next

ctypedef SkipNodeA* SkipNodeA_t

cdef inline _FABS(float v):
    if v > 0:
        return v
    else:
        return -v
        
cdef inline _MEM_CHECK(void* p):
    if p is NULL:
        raise MemoryError()

cdef inline SkipNodeA* _NEW_SKIPNODEP():
    cdef SkipNodeA* p = <SkipNodeA*>malloc(cython.sizeof(SkipNodeA))
    _MEM_CHECK(p)
    return p
    
cdef inline SkipNodeA** _NEW_SKIPNODES(int num, SkipNodeA* target):
    cdef SkipNodeA** p = <SkipNodeA**>malloc(cython.sizeof(SkipNodeA_t) * num)
    _MEM_CHECK(p)
    cdef int i
    for i in xrange(num):
        p[i] = target
    return p

cdef inline bint _ALL_ZEROS(SkipNodeA* sn):
    if sn is NULL:
        return True
    
    cdef int i
    for i in xrange(sn.length):
        if sn.values[i] != 0:
            return False
            
    return True
        
cdef inline bint _SET_VALUE(SkipNodeA* sn, long long index, float value):
    if sn is NULL:
        return False
        
    cdef long long relative_index = index - sn.index
    if relative_index >= 0 and relative_index < sn.length:
        sn.values[relative_index] = value
        return True
    else:
        return False

cdef inline float _GET_VALUE(SkipNodeA* sn, long long index):
    if sn is NULL:
        return 0
    
    cdef long long relative_index = index - sn.index
    if relative_index >= 0 and relative_index < sn.length:
        return sn.values[relative_index]
    else:
        return 0

cdef inline float _DOT(SkipNodeA* sn1, SkipNodeA* sn2, int length):
    cdef float result = 0
    cdef int i = 0
    for i in xrange(length):
       result += sn1.values[i] * sn2.values[i]
    return result

cdef SkipNodeA* newSkipNodeA(int height, long long index, float value, int length):
    #height > 0
    cdef SkipNodeA* sn = _NEW_SKIPNODEP()
    sn.height = height
    sn.length = length
    sn.index  = -1
    if length > 0:
        sn.index  = index - index % length # make it multiples of length
        sn.values = <float*>calloc(sn.length, cython.sizeof(float))
        _MEM_CHECK(sn.values)
        _SET_VALUE(sn, index, value)
    else:
        sn.values = NULL
    sn.next = _NEW_SKIPNODES(height, NULL)
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
    cdef int height
    cdef long long size
    cdef long long memory
    cdef SkipNodeA* head
    cdef SkipNodeA** found
    cdef int arrayLength
    
    def __init__(self, arrayLength = ARRAY_LENGTH, *arguments, **keywords):
        self.size        = 0
        self.height      = 0
        self.arrayLength = arrayLength
        self.head        = newSkipNodeA(MAX_HEIGHT, -1, -1, 0)
        self.found       = _NEW_SKIPNODES(MAX_HEIGHT, self.head)    
        self.memory      = MAX_HEIGHT * cython.sizeof(SkipNodeA_t) + sizeofSN(self.head)
        
    def __dealloc__(self):
        delSkipList(self.head)
        if self.found is not NULL:
            free(self.found)
        
    def __setitem__(self, key, value):
        self.upsert(key, value)
    
    def __getitem__(self, key):
        return self.find(key)
    
    def __delitem_(self, key):
        if self.find(key) != 0:
            self.upsert(key, 0)
    
    def __contains__(self, key):
        return self.find(key) != 0
    
    def __str__(self):
        a = []
        cdef SkipNodeA* curr = self.head
        cdef int i
        while curr.next[0] != NULL:
            curr = curr.next[0]
            a.append('(' + repr(curr.index) + ')')
            for i in xrange(curr.length):
                if curr.values[i] != 0:
                    a.append(':'.join([repr(i + curr.index), repr(curr.values[i])]))
        return ' '.join(a)
        
    def __repr__(self):
        return repr(self.generic())

    def _memorySize(self):
        return self.memory
    
    def _numOfNodes(self):
        return self.size
    
    def _maxHeight(self):
        return self.height
    
    def generic(self):
        cdef dict a = {}
        cdef SkipNodeA* curr = self.head
        cdef int i
        while curr.next[0] != NULL:
            curr = curr.next[0]
            for i in xrange(curr.length):
                if curr.values[i] != 0:
                    a[i + curr.index] = curr.values[i]
        return a
        
    cpdef update(self, dict f):
        cdef list kvps = f.items()
        cdef long long sz = len(kvps)
        cdef long long i
        for i in xrange(sz):
            self.upsert(kvps[i][0], kvps[i][1])
            
    cdef int randomHeight(self):
        cdef int height = 1
        while rand() & 1:
            height += 1
        if height > MAX_HEIGHT:
            height = MAX_HEIGHT
        if height > self.height: 
            self.height = height
        return height
    
    # not very effective in dot product since the searching overhead is big as well
    cdef inline SkipNodeA* jumpTo(self, SkipNodeA* curr, long long target):
        cdef int i = 0
        for i in xrange(1, curr.height):
            if curr.next[i] is NULL or curr.next[i].index > target:
                return curr.next[i - 1]
        return curr.next[i]
    
    cpdef scale(self, float w):
        cdef SkipNodeA* curr = self.head.next[0]
        cdef int i
        while curr is not NULL:
            for i in xrange(self.arrayLength):
                curr.values[i] *= w
            curr = curr.next[0]
    
    cpdef float norm1(self):
        cdef SkipNodeA* curr = self.head.next[0]
        cdef int i
        cdef float result = 0.0
        while curr is not NULL:
            for i in xrange(self.arrayLength):
                result += _FABS(curr.values[i])
            curr = curr.next[0]
        return result
    
    cpdef float norm2(self):
        cdef SkipNodeA* curr = self.head.next[0]
        cdef int i
        cdef float result = 0.0
        while curr is not NULL:
            for i in xrange(self.arrayLength):
                result += curr.values[i] * curr.values[i]
            curr = curr.next[0]
        return result
    
    cpdef trim(self, float tol = 0.00001):
        cdef SkipNodeA* curr = self.head.next[0]
        cdef int i
        while curr is not NULL:
            for i in xrange(self.arrayLength):
                if (_FABS(curr.values[i]) < tol):
                    curr.values[i] = 0
            curr = curr.next[0]
        
    cpdef add(self, SparseSkipListArray other, float w):
        cdef SkipNodeA* curr1 = self.head.next[0]
        cdef SkipNodeA* curr2 = other.head.next[0]
        cdef int i
        while curr1 is not NULL and curr2 is not NULL:
            if curr1.index == curr2.index:
                for i in xrange(self.arrayLength):
                   curr1.values[i] += w * curr2.values[i]   
                curr1 = curr1.next[0]
                curr2 = curr2.next[0]
            elif curr1.index < curr2.index:
                curr1 = curr1.next[0]
            else:
                self.updateList(curr2.index)
                self.copyNodeA(curr2, w)
                curr2 = curr2.next[0]
        if curr2 is not NULL:
            self.updateList(curr2.index)
            while curr2 is not NULL:
                self.copyNodeA(curr2, w)
                curr2 = curr2.next[0]
            
    cpdef float dot(self, SparseSkipListArray other):
        cdef SkipNodeA* curr1 = self.head.next[0]
        cdef SkipNodeA* curr2 = other.head.next[0]
        cdef float result = 0.0
        while curr1 is not NULL and curr2 is not NULL:
            if curr1.index == curr2.index:
                result += _DOT(curr1, curr2, self.arrayLength)
                curr1 = curr1.next[0]
                curr2 = curr2.next[0]
            elif curr1.index < curr2.index:
                curr1 = curr1.next[0]
            else:
                curr2 = curr2.next[0]
        return result
    
    cpdef bint updateList(self, long long index):
        cdef int i
        cdef SkipNodeA* curr = self.head
        for i in reversed(xrange(self.height)):
            while curr.next[i] != NULL and curr.next[i].index + curr.next[i].length <= index:
                curr = curr.next[i]
            self.found[i] = curr
        return self.found[0] is not NULL

    cpdef float find(self, long long index):
        if self.updateList(index):
            return _GET_VALUE(self.found[0].next[0], index)
        else:
            return 0

    # for debugging usage    
    def printFound(self):
        for i in xrange(self.height):
            print self.found[i].index
        
    cdef upsert(self, long long index, float value):
        cdef int newHeight
        cdef int i
        cdef SkipNodeA* candidate
 
        if not self.updateList(index) or not _SET_VALUE(self.found[0].next[0], index, value):
            newHeight = self.randomHeight()
            candidate = newSkipNodeA(newHeight, index, value, self.arrayLength)
            for i in xrange(newHeight):
                candidate.next[i] = self.found[i].next[i]
                self.found[i].next[i] = candidate
            self.size += 1
            self.memory += sizeofSN(candidate)

    cdef copyNodeA(self, SkipNodeA* sn, float w):
        cdef SkipNodeA* candidate
        cdef int newHeight
        cdef int i
        newHeight = self.randomHeight()
        candidate = newSkipNodeA(newHeight, sn.index, 0, self.arrayLength)
        for i in xrange(newHeight):
            candidate.next[i] = self.found[i].next[i]
            self.found[i].next[i] = candidate
            self.found[i] = candidate
        self.size += 1
        self.memory += sizeofSN(candidate)
        for i in xrange(self.arrayLength):
           candidate.values[i] += w * sn.values[i]

cpdef SparseSkipListArray difference(SparseSkipListArray a, SparseSkipListArray b, float tol = 1e-8):
    if (a.arrayLength != b.arrayLength):
        return None
        
    cdef SparseSkipListArray c = SparseSkipListArray(a.arrayLength)
    c.add(a,  1)
    c.add(b, -1)
    c.trim(tol)
    return c
    
cdef inline float _MATCH(float v1, float v2, float tol):
    if v1 == 0 and v2 == 0:
        return 0
    elif _FABS(v1 - v2) < tol:
        return 1
    else:
        return -1
    
cpdef SparseSkipListArray matching(SparseSkipListArray a, SparseSkipListArray b, float tol = 0.01):
    if (a.arrayLength != b.arrayLength):
        return None
        
    cdef int L = a.arrayLength
    cdef SparseSkipListArray c = SparseSkipListArray(L)
    cdef SkipNodeA* curr1 = a.head.next[0]
    cdef SkipNodeA* curr2 = b.head.next[0]
    cdef int i
    cdef float v
    while curr1 is not NULL and curr2 is not NULL:
        if curr1.index == curr2.index:
            for i in xrange(L):
                v = _MATCH(curr1.values[i], curr2.values[i], tol)
                if v != 0:
                    c[i + curr1.index] = v
            curr1 = curr1.next[0]
            curr2 = curr2.next[0]
        elif curr1.index < curr2.index:
            for i in xrange(L):
                if curr1.values[i] != 0:
                    c[i + curr1.index] = -1
            curr1 = curr1.next[0]
        else:
            for i in xrange(L):
                if curr2.values[i] != 0:
                    c[i + curr2.index] = -1
            curr2 = curr2.next[0]
            
    if curr1 is not NULL:
        while curr1 is not NULL:
            for i in xrange(L):
                if curr1.values[i] != 0:
                    c[i + curr1.index] = -1            
            curr1 = curr1.next[0]
            
    if curr2 is not NULL:
        while curr2 is not NULL:
            for i in xrange(L):
                if curr2.values[i] != 0:
                    c[i + curr2.index] = -1            
            curr2 = curr2.next[0]
            
    return c