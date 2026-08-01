/**
 * FIFO Queue with efficient dequeue operations
 */
export class FIFOQueue<T> {
  private items: T[] = [];
  private head = 0;

  public enqueue(item: T): void {
    this.items.push(item);
  }

  public dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head++];
    // Compact array if needed to avoid memory leaks
    if (this.head > 1024 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  public get length(): number {
    return this.items.length - this.head;
  }

  public get isEmpty(): boolean {
    return this.length === 0;
  }
}
