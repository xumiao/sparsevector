# -*- coding: utf-8 -*-
"""
Created on Sun Oct 13 23:27:25 2013

@author: xm
"""
import numpy as np

import pyximport; pyximport.install(setup_args={"include_dirs":np.get_include()}, reload_support=True)

#from sparse_vecotr import DenseArray, SparseArray                
#from sparse_block_vector import SparseBlockArray
#from sparse_skiplist_vector import SparseSkipList

from timeit import timeit

      
def generateRandomSparseData(sparsity = 0.5, sz = 1000000):
    data = []
    def insertValue(x):
        v = np.random.rand()
        if v > sparsity:
            data.append((x,v))
    map(insertValue, range(sz))
    return data

def generateRandomBlockSparseData(blockSize = 1000, jumpRange = 100, sz = 1000):
    data = []
    def insertValues(x, y):
        x += int(np.random.rand() * jumpRange) * blockSize
        for i in range(blockSize):
            data.append(((x+i), np.random.rand()))
    reduce(insertValues, range(sz), 0)
    
def testAdd(a, b, w):
    a.add(b, w)

def testDotProduct(a, b):
    return a.dot(b)

def testMemorySize(a):
    print a.memorySize()
        
def experSequentialRandomInsert():
    sz = 10
    sparsity = 0.5
#    b = DenseArray(sz)
#    sa = SparseArray()
#    sb = SparseArray()
#    sba = SparseBlockArray(100)
#    sbb = SparseBlockArray(100)
#    ssa = SparseSkipList()
#    ssb = SparseSkipList()
    
    denseResult = timeit("for key,value in data: a[key] = value", \
    setup="from sparse_vector import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sz,sparsity,sz),\
    number=100)

def experSequentialBlockInsert():
    pass
    