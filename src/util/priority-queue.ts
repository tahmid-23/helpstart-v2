import { Comparator } from './comparator.js';

export interface PriorityQueue<T> extends Iterable<T> {
  size(): number;

  isEmpty(): boolean;

  peek(): T | undefined;

  pop(): T;

  push(element: T): void;

  clear(): void;
}

export class Heap<T> implements PriorityQueue<T> {
  private readonly comparator: Comparator<T>;
  private readonly heap: T[] = [];
  heapSize = 0;

  constructor(comparator: Comparator<T>) {
    this.comparator = comparator;
  }

  size() {
    return this.heapSize;
  }

  isEmpty(): boolean {
    return this.heapSize === 0;
  }

  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    return this.heap[0];
  }

  pop(): T {
    const root = this.peek();
    if (!root) {
      throw new Error('Heap is empty');
    }

    const node = (this.heap[0] = this.heap[this.heapSize - 1]);
    --this.heapSize;

    let i = 0;
    while (true) {
      const leftIndex = 2 * i + 1;
      if (leftIndex >= this.heapSize) {
        break;
      }

      const left = this.heap[leftIndex];
      const rightIndex = 2 * i + 2;
      if (rightIndex >= this.heapSize) {
        if (this.comparator(node, left) < 0) {
          this.heap[i] = left;
          this.heap[leftIndex] = node;
        }
        break;
      }

      const right = this.heap[rightIndex];
      let maxIndex, maxValue;
      if (this.comparator(left, right) < 0) {
        maxIndex = rightIndex;
        maxValue = right;
      } else {
        maxIndex = leftIndex;
        maxValue = left;
      }

      if (this.comparator(maxValue, node) < 0) {
        break;
      }
      this.heap[i] = maxValue;
      this.heap[maxIndex] = node;
      i = maxIndex;
    }

    return root;
  }

  push(element: T): void {
    if (this.heap.length === this.heapSize) {
      this.heap.length *= 2;
    }

    this.heap[this.heapSize] = element;
    ++this.heapSize;

    let i = this.heapSize - 1;
    while (i > 0) {
      const parentIndex = Math.floor((i - 1) / 2);
      const parent = this.heap[parentIndex];

      if (this.comparator(parent, element) >= 0) {
        break;
      }

      this.heap[i] = parent;
      this.heap[parentIndex] = element;
      i = parentIndex;
    }
  }

  clear(): void {
    this.heap.length = 0;
    this.heapSize = 0;
  }

  *[Symbol.iterator](): Iterator<T> {
    const sortedHeap = this.heap
      .slice(0, this.heapSize)
      .sort(this.comparator)
      .reverse();
    for (const element of sortedHeap) {
      yield element;
    }
  }
}
