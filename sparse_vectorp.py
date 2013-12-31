# -*- coding: utf-8 -*-
"""
Created on Thu Oct 10 17:31:08 2013

@author: xm
"""
import numpy as np

class DenseArray(object):
    def __init__(self, sz, dtype=float):
        self.data = (np.random.rand(sz) * 2).astype(int).astype(dtype)
        self.size = sz
    
    def __setitem__(self, key, value):
        self.data[key] = value
        
    def __getitem__(self, key):
        return self.data[key]
    
    def memorySize(self):
        return self.data.nbytes
        
    def add(self, other, w):
        self.data += w * other.data
    
    def dot(self, other):
        return np.dot(self.data, other.data)
        
        
class SparseArray(object):
    def __init__(self, dtype = float):
        self.data = np.zeros(0)
        self.size = 0
    
    def __setitem__(self, key, value):
        if (key >= self.size):
            self.size = (key + 1) * 2
            self.data.resize(self.size)
        self.data[key] = value
    
    def __getitem__(self, key):
        if (key >= self.size):
            return 0
        else:
            return self.data[key]
    
    def memorySize(self):
        return self.data.nbytes
        
    def add(self, other, w):
        if (other.size > self.size):
            self.data.resize(other.size)
            self.size = other.size
        self.data[:other.size] += other.data * w
    
    def dot(self, other):
        if (other.size > self.size):
            return np.dot(self.data, other.data[:self.size])
        elif (other.size < self.size):
            return np.dot(self.data[:other.size], other.data)
        else:
            return np.dot(self.data, other.data)
        
