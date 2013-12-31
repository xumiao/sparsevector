# -*- coding: utf-8 -*-
"""
Created on Sun Oct 13 23:27:25 2013

@author: xm
"""
import numpy as np

import pyximport; pyximport.install(setup_args={"include_dirs":np.get_include() + ';.'}, reload_support=True)

from sparse_vector import SparseVector                
from sparse_vectorp import DenseArray, SparseArray
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
    
def experSequentialRandomInsert(sz, sparsity, arrayLength):
    denseResult = timeit("for key,value in data: a[key] = value", \
    setup="from sparse_vectorp import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sz,sparsity,sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_vectorp import SparseArray;\
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
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(arrayLength, sparsity, sz),\
    number=100)
    print sparseSkipListArrayResult
    
    sparseVectorResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d)"%(sparsity, sz),\
    number=100)
    print sparseVectorResult
    
def experRandomBlockInsert(blockSize, jumpRange, sz, arrayLength):
#    denseResult = timeit("for key,value in data: a[key] = value", \
#    setup="from sparse_vectorp import DenseArray; \
#    import sparse_vector_tester as svt;\
#    sz = %d;\
#    a=DenseArray(sz);\
#    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize*sz, blockSize, jumpRange, sz),\
#    number=100)
#    print denseResult
    
    sparseResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_vectorp import SparseArray;\
    import sparse_vector_tester as svt;\
    a=SparseArray();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize, jumpRange, sz),\
    number=1)
    print sparseResult

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
    
    sparseVectorResult = timeit("for key, value in data: a[key] = value", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d)"%(blockSize, jumpRange, sz),\
    number=10)
    print sparseVectorResult
    
def experSequentialRandomMemory(sz, sparsity, arrayLength):
    data = generateRandomSparseData(sparsity=sparsity, sz=sz)
    a = DenseArray(sz)
    b = SparseArray()
    c = SparseSkipList()
    d = SparseSkipListArray(arrayLength)
    e = SparseVector()
    addData(a, data)
    addData(b, data)
    addData(c, data)
    addData(d, data)
    addData(e, data)
    print "Dense ", a.memorySize()
    print "Sparse ", b.memorySize()
    print "SparseList ", c.memorySize(), c.height, c.size
    print "SparseListArray ", d._memorySize(), d._maxHeight(), d._numOfNodes()
    print "SparseVector ", e._memorySize(), e._maxHeight(), e._numOfNodes()

def experSequentialRandomDotSelf(sz, sparsity, arrayLength):
    denseResult = timeit("a.dot(a)", \
    setup="from sparse_vectorp import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(sz,sparsity,sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("a.dot(a)", \
    setup = "from sparse_vectorp import SparseArray;\
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

    sparseVectorResult = timeit("a.norm2()", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a, data)"%(sparsity,sz),\
    number=100)
    print sparseVectorResult 

def experSequentialRandomDot(sz, sparsity1, sparsity2, arrayLength):
    dataA = generateRandomSparseData(sparsity1, sz)
    dataB = generateRandomSparseData(sparsity2, sz)
    a=DenseArray(sz)
    b=DenseArray(sz)
    addData(a, dataA)
    addData(b, dataB)
    print 'DenseArray ', a.dot(b)
    
    a=SparseArray(sz)
    b=SparseArray(sz)
    addData(a, dataA)
    addData(b, dataB)
    print 'SparseArray ', a.dot(b)

    a = SparseSkipList()
    b = SparseSkipList()
    addData(a, dataA)
    addData(b, dataB)
    print 'Skiplist ', a.dot(b)

    a = SparseSkipListArray(arrayLength)
    b = SparseSkipListArray(arrayLength)
    addData(a, dataA)
    addData(b, dataB)
    print 'SkiplistArray ', a.dot(b)
    
    a = SparseVector()
    b = SparseVector()
    addData(a, dataA)
    addData(b, dataB)
    print 'SparseVector ', a.dot(b)
    
    denseResult = timeit("a.dot(b)", \
    setup="from sparse_vectorp import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sz, sparsity1, sz, sparsity2, sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("a.dot(b)", \
    setup = "from sparse_vectorp import SparseArray;\
    import sparse_vector_tester as svt;\
    a=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sparsity1, sz, sparsity2, sz),\
    number=100)
    print sparseResult

    sparseSkipListResult = timeit("a.dot(b)", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseSkipList();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sparsity1,sz,sparsity2,sz),\
    number=100)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("a.dot(b)", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(arrayLength, sparsity1, sz, arrayLength, sparsity2, sz),\
    number=100)
    print sparseSkipListArrayResult    

    sparseVectorResult = timeit("a.dot(b)", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sparsity1,sz,sparsity2,sz),\
    number=100)
    print sparseVectorResult 

def experSequentialRandomAdd(sz, sparsity1, sparsity2, arrayLength):
    denseResult = timeit("[a.add(b,1) for i in range(10)]", \
    setup="from sparse_vectorp import DenseArray; \
    import sparse_vector_tester as svt;\
    sz = %d;\
    a=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=DenseArray(sz);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sz, sparsity1, sz, sparsity2, sz),\
    number=100)
    print denseResult
    
    sparseResult = timeit("[a.add(b,1) for i in range(10)]", \
    setup = "from sparse_vectorp import SparseArray;\
    import sparse_vector_tester as svt;\
    a=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseArray();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(sparsity1, sz, sparsity2, sz),\
    number=100)
    print sparseResult

#    sparseSkipListResult = timeit("a.add(b,1)", \
#    setup = "from sparse_skiplist_vector import SparseSkipList;\
#    import sparse_vector_tester as svt;\
#    a=SparseSkipList();\
#    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
#    svt.addData(a,data);\
#    b=SparseSkipList();\
#    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
#    svt.addData(b, data)"%(sparsity1,sz,sparsity2,sz),\
#    number=100)
#    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("[a.add(b,1) for i in range(10)]", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseSkipListArray(%d);\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data)"%(arrayLength, sparsity1, sz, arrayLength, sparsity2, sz),\
    number=100)
    print sparseSkipListArrayResult    

    sparseVectorResult = timeit("[a.add(b,1) for i in range(10)]", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(a,data);\
    b=SparseVector();\
    data = svt.generateRandomSparseData(sparsity=%f, sz=%d);\
    svt.addData(b, data);\
    a.add(b,1)"%(sparsity1,sz,sparsity2,sz),\
    number=100)
    print sparseVectorResult 
    
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

    sparseVectorResult = timeit("a.dot(a)", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data)"%(blockSize, jumpRange, sz),\
    number=10)
    print sparseVectorResult
    
def experRandomBlockDot(blockSize, jumpRange, sz, arrayLength):
    dataA = generateRandomBlockSparseData(blockSize, jumpRange, sz)
    dataB = generateRandomBlockSparseData(blockSize, jumpRange, sz)
    a = SparseSkipList()
    b = SparseSkipList()
    addData(a, dataA)
    addData(b, dataB)
    r1 = a.dot(b)
    print 'Skiplist ', r1

    a = SparseSkipListArray(arrayLength)
    b = SparseSkipListArray(arrayLength)
    addData(a, dataA)
    addData(b, dataB)
    r2 = a.dot(b)
    print 'SkiplistArray ', r2
    
    a = SparseVector()
    b = SparseVector()
    addData(a, dataA)
    addData(b, dataB)
    r3 = a.dot(b)
    print 'SparseVector ', r3
    
    sparseSkipListResult = timeit("a.dot(b)", \
    setup = "from sparse_skiplist_vector import SparseSkipList;\
    import sparse_vector_tester as svt;\
    a=SparseSkipList();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data);\
    b=SparseSkipList();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(b, data)"%(blockSize, jumpRange, sz, blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("a.dot(b)", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data);\
    b=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(b, data)"%(arrayLength, blockSize, jumpRange, sz,arrayLength, blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListArrayResult
    
    sparseVectorResult = timeit("a.dot(b)", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data);\
    b=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(b, data)"%(blockSize, jumpRange, sz, blockSize, jumpRange, sz),\
    number=10)
    print sparseVectorResult
    
def experRandomBlockAdd(blockSize, jumpRange, sz, arrayLength):
    dataA = generateRandomBlockSparseData(blockSize, jumpRange, sz)
    dataB = generateRandomBlockSparseData(blockSize, jumpRange, sz)
    a = SparseSkipList()
    b = SparseSkipList()
    addData(a, dataA)
    addData(b, dataB)
    a.add(b, 2)

    a = SparseSkipListArray(arrayLength)
    b = SparseSkipListArray(arrayLength)
    addData(a, dataA)
    addData(b, dataB)
    a.add(b, 2)
    
    a = SparseVector()
    b = SparseVector()
    addData(a, dataA)
    addData(b, dataB)
    a.add(b, 2)
    
#    sparseSkipListResult = timeit("a.add(b,2);a.add(b,2);a.add(b,2);a.add(b,2)", \
#    setup = "from sparse_skiplist_vector import SparseSkipList;\
#    import sparse_vector_tester as svt;\
#    a=SparseSkipList();\
#    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
#    svt.addData(a, data);\
#    b=SparseSkipList();\
#    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
#    svt.addData(b, data)"%(blockSize, jumpRange, sz, blockSize, jumpRange, sz),\
#    number=10)
#    print sparseSkipListResult

    sparseSkipListArrayResult = timeit("[a.add(b,2) for i in range(10)]", \
    setup = "from sparse_skiplist_array_vector import SparseSkipListArray;\
    import sparse_vector_tester as svt;\
    a=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data);\
    b=SparseSkipListArray(%d);\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(b, data)"%(arrayLength, blockSize, jumpRange, sz,arrayLength, blockSize, jumpRange, sz),\
    number=10)
    print sparseSkipListArrayResult
    
    sparseVectorResult = timeit("[a.add(b,2) for i in range(10)]", \
    setup = "from sparse_vector import SparseVector;\
    import sparse_vector_tester as svt;\
    a=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(a, data);\
    b=SparseVector();\
    data = svt.generateRandomBlockSparseData(blockSize=%d, jumpRange=%d, sz=%d);\
    svt.addData(b, data)"%(blockSize, jumpRange, sz, blockSize, jumpRange, sz),\
    number=10)
    print sparseVectorResult

