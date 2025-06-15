// Simple in-memory storage for demo
// In production, use a proper database like Supabase, PlanetScale, etc.

interface StoredFile {
  name: string
  type: string
  data: string // base64
  uploadTime: string
  size: number
}

class FileStorage {
  private storage = new Map<string, StoredFile>()

  store(id: string, file: StoredFile): void {
    this.storage.set(id, file)

    // Clean up old files (keep only last 100 files)
    if (this.storage.size > 100) {
      const entries = Array.from(this.storage.entries())
      entries.sort((a, b) => new Date(a[1].uploadTime).getTime() - new Date(b[1].uploadTime).getTime())

      // Remove oldest files
      const toRemove = entries.slice(0, entries.length - 100)
      toRemove.forEach(([key]) => this.storage.delete(key))
    }
  }

  get(id: string): StoredFile | undefined {
    return this.storage.get(id)
  }

  has(id: string): boolean {
    return this.storage.has(id)
  }

  delete(id: string): boolean {
    return this.storage.delete(id)
  }

  size(): number {
    return this.storage.size
  }
}

// Global instance
declare global {
  var _fileStorage: FileStorage | undefined
}

const fileStorage = global._fileStorage || new FileStorage()
global._fileStorage = fileStorage
