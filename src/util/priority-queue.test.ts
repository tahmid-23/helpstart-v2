import { Heap, PriorityQueue } from './priority-queue.js';

let priorityQueue: PriorityQueue<number>;

beforeEach(() => {
  priorityQueue = new Heap((a, b) => a - b);
});

test('Priority Queue initially has size 0', () => {
  expect(priorityQueue.size()).toBe(0);
});

test('Priority Queue initially empty', () => {
  expect(priorityQueue.isEmpty()).toBe(true);
});

test('Adding to Priority Queue increases size', () => {
  priorityQueue.push(1);
  expect(priorityQueue.size()).toBe(1);
});

test('Adding to Priority Queue makes it no longer empty', () => {
  priorityQueue.push(1);
  expect(priorityQueue.isEmpty()).toBe(false);
});

test('Peeking from empty Priority Queue returns undefined', () => {
  expect(priorityQueue.peek()).toBe(undefined);
});

test('Popping from empty Priority Queue throws', () => {
  expect(priorityQueue.pop).toThrow();
});

test('Max element of one-element Priority Queue is the same element', () => {
  priorityQueue.push(1);
  expect(priorityQueue.pop()).toBe(1);
});

test('Popping from one-element Priority Queue results in 0 size', () => {
  priorityQueue.push(1);
  priorityQueue.pop();

  expect(priorityQueue.size()).toBe(0);
});

test('Popping from one-element Priority Queue results in it being empty', () => {
  priorityQueue.push(1);
  priorityQueue.pop();

  expect(priorityQueue.isEmpty()).toBe(true);
});

test('Adding 2, then 1 to a Priority Queue results in 2, then 1 when popped', () => {
  priorityQueue.push(2);
  priorityQueue.push(1);

  expect(priorityQueue.pop()).toBe(2);
  expect(priorityQueue.pop()).toBe(1);
});

test('Adding 1, then 2 to a Priority Queue results in 2, then 1 when popped', () => {
  priorityQueue.push(1);
  priorityQueue.push(2);

  expect(priorityQueue.pop()).toBe(2);
  expect(priorityQueue.pop()).toBe(1);
});

test('Unordered sequential elements are popped in decreasing order', () => {
  priorityQueue.push(3);
  priorityQueue.push(4);
  priorityQueue.push(2);
  priorityQueue.push(1);
  priorityQueue.push(5);

  expect(priorityQueue.pop()).toBe(5);
  expect(priorityQueue.pop()).toBe(4);
  expect(priorityQueue.pop()).toBe(3);
  expect(priorityQueue.pop()).toBe(2);
  expect(priorityQueue.pop()).toBe(1);
});

test('Iterating over unordered sequential elements are in decreasing order', () => {
  priorityQueue.push(3);
  priorityQueue.push(4);
  priorityQueue.push(2);
  priorityQueue.push(1);
  priorityQueue.push(5);

  const iterator = priorityQueue[Symbol.iterator]();

  expect(iterator.next().value).toBe(5);
  expect(iterator.next().value).toBe(4);
  expect(iterator.next().value).toBe(3);
  expect(iterator.next().value).toBe(2);
  expect(iterator.next().value).toBe(1);
  expect(iterator.next().done).toBe(true);
});
