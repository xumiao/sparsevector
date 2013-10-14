# -*- coding: utf-8 -*-
"""
Created on Sun Oct 13 23:27:25 2013

@author: xm
"""
import pyximport; pyximport.install(setup_args={"include_dirs":np.get_include()}, reload_support=True)

import numpy as np

from sparse_vecotr import DenseArray, SparseArray                
from sparse_block_vector import SparseBlockArray
from sparse_skiplist_vector import SparseSkipList

from timeit import timeit

        self.a = DenseArray(100000)
        self.b = DenseArray(100000)
        self.sa = SparseArray()
        self.sb = SparseArray()
        self.sba = SparseBlockArray(100)
        self.sbb = SparseBlockArray(100)
        self.ssa = SparseSkipList()
        self.ssb = SparseSkipList()
        
def testAdd(a, b, w):
    a.add(b, w)

def testSequentialRandomInsert(a, sparsity = 0.5, sz = 1000000):
    def insertValue(x):
        v = np.random.rand()
        if v > sparsity:
            a[x] = v
    map(insertValue, range(sz))

def testSequentialBlockInsert(a, blockSize = 1000, jumpRange = 100, sz = 1000):
    def insertValues(x):
        x += int(np.random.rand() * jumpRange)
        for i in range(blockSize):
            a[x+i] = np.random.rand()
    map(insertValues, range(sz))
    
def testDotProduct(a, b):
    return a.dot(b)

def testMemorySize(a):
    print a.memorySize()
        
def experSequentialRandomInsert():
    pass

def experSequentialBlockInsert():
    pass
    