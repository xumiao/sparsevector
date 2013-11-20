# -*- coding: utf-8 -*-
"""
Created on Sun Oct 13 23:27:25 2013

@author: xm
"""
import numpy as np

import pyximport; pyximport.install(setup_args={"include_dirs":np.get_include()}, reload_support=True)

from sparse_vector import DenseArray, SparseArray                
from sparse_block_vector import SparseBlockArray
from sparse_skiplist_vector import SparseSkipList
from sparse_skiplist_array_vector import SparseSkipListArray

from timeit import timeit

def generateRandomSparseData(sparsity = 0.5, sz = 1000000):
    data = []
    def insertValue(x):
        v = np.random.rand()
        if v > sparsity:
            data.append((x,v))
    map(insertValue, range(sz))
    if data[0][0] != 0:
        data.append((0, 0.5))
    if data[-1][0] != sz - 1:
        data.append((sz - 1, 0.5))
    return data

def generateRandomBlockSparseData(blockSize = 1000, jumpRange = 100, sz = 1000):
    data = []
    def insertValues(x, y):
        x += int(np.random.rand() * jumpRange) * blockSize
        for i in range(blockSize):
            data.append(((x+i), np.random.rand()))
        return x
    reduce(insertValues, range(sz), 0)
    return data
    
def testAdd(a, b, w):
    a.add(b, w)

def testDotProduct(a, b):
    return a.dot(b)

def testMemorySize(a):
    print a.memorySize()

def addData(a, data):
    for key, value in data:
        a[key] = value
    
def experSequentialRandomInsert(sz, sparsity):
    denseResult = timeit("for key,value in data: a[key] = value", \
    setup="from sparse_vector import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sz,sparsity,sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_vector import SparseArray;\
    import sparse_vector_tester as svt;\
    a=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sparsity, sz),\
    number=100)
    print sparseResult

    sparseSkipListResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sparsity, sz),\
    number=100)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(1024);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sparsity, sz),\
    number=100)
    print sparseSkipListArrayResult
    
def experRandomBlockInsert(blockSize, jumpRange, sz, arrayLength):
#    denseResult = timeit("for key,value in data: a[key] = value", \
#    setup="from sparse_vector import DenseArray; \
#    import sparse_vector_tester as svt;\
#    sz = %d;\
#    a=DenseArray(sz);\
#    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize*sz, blockSize, jumpRange, sz),\
#    number=100)
#    print denseResult
    
#    sparseResult = timeit("for key, value in data: a[key] = value", \
#    setup = "from sparse_vector import SparseArray;\
#    import sparse_vector_tester as svt;\
#    a=SparseArray();\
#    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize, jumpRange, sz),\
#    number=1)
#    print sparseResult

    sparseSkipListResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(arrayLength, blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListArrayResult
 
def experSequentialRandomDotSelf(sz, sparsity, arrayLength):
    denseResult = timeit("a.dot(a)", \
    setup="from sparse_vector import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(sz,sparsity,sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("a.dot(a)", \
    setup = "from sparse_vector import SparseArray;\
    import sparse_vector_tester as svt;\
    a=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(sparsity,sz),\
    number=100)
    print sparseResult

    sparseSkipListResult = timeit("a.dot(a)", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(sparsity,sz),\
    number=100)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("a.dot(a)", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(arrayLength, sparsity,sz),\
    number=100)
    print sparseSkipListArrayResult    
    
def experRandomBlockDotSelf(blockSize, jumpRange, sz, arrayLength):
    sparseSkipListResult = timeit("a.dot(a)", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data)"%(blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("a.dot(a)", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data)"%(arrayLength, blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListArrayResult    