"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Search, Filter, CalendarIcon, AlertTriangle, X } from "lucide-react"
import { format } from "date-fns"
import { search, getAllTags, getAllIssueTypes, type SearchResult, type SearchOptions } from "@/lib/search-service"
import { getSessions } from "@/lib/session-manager-enhanced"
import type { Issue, Session } from "@/lib/types"

interface SearchPanelProps {
  onSelectIssue: (issue: Issue, sessionId: string) => void
  onSelectSession: (session: Session) => void
}

export function SearchPanel({ onSelectIssue, onSelectSession }: SearchPanelProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [issueTypes, setIssueTypes] = useState<string[]>([])

  // Filter states
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })

  // Load sessions, tags, and issue types
  useEffect(() => {
    const loadData = async () => {
      const loadedSessions = await getSessions()
      setSessions(loadedSessions)

      const loadedTags = await getAllTags()
      setTags(loadedTags)

      const loadedTypes = await getAllIssueTypes()
      setIssueTypes(loadedTypes)
    }

    loadData()
  }, [])

  // Handle search
  const handleSearch = async () => {
    if (!query.trim() && !hasActiveFilters()) return

    setLoading(true)

    try {
      // Build search options
      const options: SearchOptions = {}

      if (selectedSessions.length > 0) {
        options.sessionIds = selectedSessions
      }

      if (selectedTypes.length > 0) {
        options.issueTypes = selectedTypes
      }

      if (selectedSeverities.length > 0) {
        options.severities = selectedSeverities
      }

      if (selectedTags.length > 0) {
        options.tags = selectedTags
      }

      if (dateRange.start && dateRange.end) {
        options.dateRange = {
          start: dateRange.start.getTime(),
          end: dateRange.end.getTime(),
        }
      }

      const searchResults = await search(query, options)
      setResults(searchResults)
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setLoading(false)
    }
  }

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return (
      selectedSessions.length > 0 ||
      selectedTypes.length > 0 ||
      selectedSeverities.length > 0 ||
      selectedTags.length > 0 ||
      (dateRange.start !== null && dateRange.end !== null)
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedSessions([])
    setSelectedTypes([])
    setSelectedSeverities([])
    setSelectedTags([])
    setDateRange({ start: null, end: null })
  }

  // Toggle session selection
  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  // Toggle issue type selection
  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  // Toggle severity selection
  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity],
    )
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "issue" && result.sessionId) {
      onSelectIssue(result.item as Issue, result.sessionId)
    } else if (result.type === "session") {
      onSelectSession(result.item as Session)
    }
  }

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return "Select date"
    return format(date, "PPP")
  }

  // Get highlight for search result
  const getHighlight = (result: SearchResult): string => {
    if (result.matchedOn.includes("title")) {
      return result.type === "issue" ? (result.item as Issue).title : (result.item as Session).name
    }

    if (result.matchedOn.includes("notes")) {
      const notes = (result.item as Issue).notes
      if (notes) {
        const index = notes.toLowerCase().indexOf(query.toLowerCase())
        if (index >= 0) {
          const start = Math.max(0, index - 20)
          const end = Math.min(notes.length, index + query.length + 20)
          return `...${notes.substring(start, end)}...`
        }
      }
    }

    if (result.matchedOn.includes("url")) {
      return result.type === "issue" ? (result.item as Issue).url || "" : (result.item as Session).url
    }

    return result.matchedOn.join(", ")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues and sessions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Search className="mr-2 h-4 w-4" />}
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-secondary" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Search Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            <Tabs defaultValue="sessions">
              <TabsList>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="types">Issue Types</TabsTrigger>
                <TabsTrigger value="severities">Severities</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="dates">Date Range</TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="mt-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`session-${session.id}`}
                        checked={selectedSessions.includes(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                      />
                      <Label htmlFor={`session-${session.id}`} className="truncate">
                        {session.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="types" className="mt-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {["bug", "feature", "note", "improvement", ...issueTypes].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <Label htmlFor={`type-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="severities" className="mt-4">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {["critical", "high", "medium", "low"].map((severity) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${severity}`}
                        checked={selectedSeverities.includes(severity)}
                        onCheckedChange={() => toggleSeverity(severity)}
                      />
                      <Label htmlFor={`severity-${severity}`}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tags" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="dates" className="mt-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDate(dateRange.start)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.start || undefined}
                          onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDate(dateRange.end)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.end || undefined}
                          onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Active filters */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {selectedSessions.length > 0 && <Badge variant="secondary">Sessions: {selectedSessions.length}</Badge>}

          {selectedTypes.length > 0 && <Badge variant="secondary">Types: {selectedTypes.length}</Badge>}

          {selectedSeverities.length > 0 && <Badge variant="secondary">Severities: {selectedSeverities.length}</Badge>}

          {selectedTags.length > 0 && <Badge variant="secondary">Tags: {selectedTags.length}</Badge>}

          {dateRange.start && dateRange.end && (
            <Badge variant="secondary">
              Date: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </Badge>
          )}
        </div>
      )}

      {/* Search results */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Searching...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-medium">Results ({results.length})</h3>

          <div className="space-y-2">
            {results.map((result, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.type === "issue" ? "default" : "secondary"}>{result.type}</Badge>

                        {result.type === "issue" && (result.item as Issue).severity && (
                          <Badge
                            variant="outline"
                            className={
                              (result.item as Issue).severity === "critical"
                                ? "border-red-500 text-red-500"
                                : (result.item as Issue).severity === "high"
                                  ? "border-orange-500 text-orange-500"
                                  : (result.item as Issue).severity === "medium"
                                    ? "border-yellow-500 text-yellow-500"
                                    : "border-green-500 text-green-500"
                            }
                          >
                            {(result.item as Issue).severity}
                          </Badge>
                        )}
                      </div>

                      <h4 className="mt-1 font-medium">
                        {result.type === "issue" ? (result.item as Issue).title : (result.item as Session).name}
                      </h4>

                      <p className="mt-1 text-sm text-muted-foreground">{getHighlight(result)}</p>

                      {result.type === "issue" && (result.item as Issue).tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(result.item as Issue).tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {new Date(
                        result.type === "issue"
                          ? (result.item as Issue).timestamp
                          : (result.item as Session).lastUpdated,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        query.trim() !== "" && (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div>
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No results found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
