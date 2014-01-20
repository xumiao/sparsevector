flexiblevector
============

Implementation of a dynamic sparse vector in sparse_vector.pyx

Numpy array is great in performance, but it does not handle sparse data easily, and it does not support
dynamic properties natively. 

Highly optimized Sparse Vector implemented based on SkipList

It has the following advantages:

1. It allows dynamic insertion, deletion, and modification. 

   All in O(logn) scale due to SkipList properties.
   
2. Smoothly transits from sparse vector and dense vector, when the indices are adjacent.

   If the resulting index space contains entire range, e.g., [1,2,3], it behaves like a dense array.
   
   If the resulting indices are completely seperated, e.g., [1,3,5], it behaves like a SkipList.
   
   If the resulting indices are partially connected, e.g., [1,2,5], it is a SkipList on top of segments.
   
3. It speedups the following computation scenarios on vector addition and dot products:

   1). Very sparse data operations. Faster than numpy array by ~100 times, similar to SkipList
   
   2). Dense data operations. Faster than plain SkipList by ~1000 times, similar to numpy array
   
   3). Very sparse data on Dense data. Faster than both numpy and SkipList by ~100 times
   
4. It saves quite amount of memory on both dense and sparse data. Smaller than numpy array by ~10-100 times

5. It performs moderately worse in mildly sparse data, i.e., sparsity range between 0.2-0.8.

   About 4~20 times slower than numpy array (considering the optimization done using BLAS)
   

comparisons with different sparse vector implementations:

Numpy array

Dynamic numpy array

Plain SkipList

SkipList with a certain sized array at leaves

