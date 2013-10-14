# -*- coding: utf-8 -*-
"""
Created on Sat Oct 12 17:54:15 2013

@author: xm
"""
from __future__ import division

import numpy as np
cimport numpy as np
cimport cython

cdef class SparseBlockArray(object):
    cpdef public dict data
    cpdef public int blockSize
    cpdef public int numBlocks
    cpdef public set keys
    cpdef public int size
    cpdef public object dtype
    
    def __init__(self, blockSize = 1000, dtype = float):
        self.data = dict()
        self.blockSize = blockSize
        self.numBlocks = 0
        self.keys = set()
        self.size = 0 
        self.dtype = dtype
    
    def __setitem__(self, key, value):
        cdef int blockIndex = key / self.blockSize
        cdef int offset = key - blockIndex * self.blockSize
        if (not self.data.has_key(blockIndex)):
            self.data[blockIndex] = np.zeros(self.blockSize, dtype=self.dtype)
            self.numBlocks += 1
            self.size += self.blockSize
            self.keys.add(blockIndex)
        self.data[blockIndex][offset] = value
    
    def __getitem__(self, key):
        cdef int blockIndex = key / self.blockSize
        cdef int offset = key - blockIndex * self.blockSize
        if self.data.has_key(key):
            return self.data[blockIndex][offset]
        else:
            return 0
    
    def memorySize(self):
        if (self.numBlocks == 0):
            return 0
        else:
            return self.numBlocks * self.data.values()[0].nbytes
    
    def add(self, other, w):
        for x in self.keys & other.keys:
            self.data[x] += w * other.data[x]
    
    cpdef float dot(self, SparseBlockArray other):
        cdef int index
        cdef float result = 0.0
        cdef list keys = list(self.keys & other.keys)
        cdef int key
        cdef int numKey = len(keys)
        for index in range(numKey):
            key = keys[index]
            result += np.dot(self.data[key], other.data[key])
        return result