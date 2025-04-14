import { useState } from 'react'
import { Command } from 'lucide-react'

interface OutreachInputProps {
  prospectName: string
  setProspectName: (name: string) => void
  prospectCompany: string
  setProspectCompany: (company: string) => void
  inputMode: 'name' | 'company' | 'display'
  setInputMode: (mode: 'name' | 'company' | 'display') => void
  handleChatSubmit: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hasList: 'yes' | 'no' | null
  setHasList: (value: 'yes' | 'no' | null) => void
  chatMode: boolean
  setChatMode: (value: boolean) => void
}

export function OutreachInput({
  prospectName,
  setProspectName,
  prospectCompany,
  setProspectCompany,
  inputMode,
  setInputMode,
  handleChatSubmit,
  handleFileChange,
  hasList,
  setHasList,
  chatMode,
  setChatMode
}: OutreachInputProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileChange(event)
    }
  }

  if (hasList === null) {
    return (
      <div>
        <h2 className="text-lg font-medium text-turbo-black mb-4">Do you have a list of prospects?</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setHasList('yes')}
            className="p-4 text-center rounded-lg border-2 border-turbo-black/10 hover:border-turbo-blue transition-colors"
          >
            <p className="font-medium text-turbo-black mb-1">Yes, I have a CSV</p>
            <p className="text-sm text-turbo-black/60">Upload a list of prospects</p>
          </button>
          <button
            onClick={() => setHasList('no')}
            className="p-4 text-center rounded-lg border-2 border-turbo-black/10 hover:border-turbo-blue transition-colors"
          >
            <p className="font-medium text-turbo-black mb-1">No, just one person</p>
            <p className="text-sm text-turbo-black/60">Enter single prospect</p>
          </button>
        </div>
      </div>
    )
  }

  if (hasList === 'yes') {
    return (
      <div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
            isDragging ? 'border-turbo-blue bg-turbo-blue/5' : 'border-turbo-black/10'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="block cursor-pointer"
          >
            <p className="font-medium text-turbo-black mb-1">
              {isDragging ? 'Drop your CSV here' : 'Upload your CSV'}
            </p>
            <p className="text-sm text-turbo-black/60">
              Drag and drop or click to select
            </p>
          </label>
        </div>
        <button
          onClick={() => setHasList(null)}
          className="mt-3 text-sm text-turbo-black/60 hover:text-turbo-blue transition-colors"
        >
          ← Go back
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {inputMode === 'name' && (
          <div>
            <label className="block text-sm font-medium text-turbo-black mb-2">
              Who would you like to reach out to?
            </label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prospectName.trim()) {
                  setInputMode('company')
                }
              }}
              placeholder="Enter their full name..."
              className="w-full p-3 rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors"
              autoFocus
            />
          </div>
        )}

        {inputMode === 'company' && (
          <div>
            <label className="block text-sm font-medium text-turbo-black mb-2">
              What company are they from?
            </label>
            <input
              type="text"
              value={prospectCompany}
              onChange={(e) => setProspectCompany(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prospectCompany.trim()) {
                  handleChatSubmit()
                }
              }}
              placeholder="Enter their company name..."
              className="w-full p-3 rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors"
              autoFocus
            />
            <button
              onClick={() => setInputMode('name')}
              className="mt-3 text-sm text-turbo-black/60 hover:text-turbo-blue transition-colors"
            >
              ← Go back
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setHasList(null)}
            className="text-sm text-turbo-black/60 hover:text-turbo-blue transition-colors"
          >
            Switch to CSV upload
          </button>
          {inputMode === 'name' ? (
            <button
              onClick={() => setInputMode('company')}
              disabled={!prospectName.trim()}
              className="px-4 py-2 bg-turbo-blue text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-turbo-blue/90 transition-colors flex items-center gap-2"
            >
              Next
              <Command className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleChatSubmit}
              disabled={!prospectCompany.trim()}
              className="px-4 py-2 bg-turbo-blue text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-turbo-blue/90 transition-colors flex items-center gap-2"
            >
              Start Research
              <Command className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 