"use client";

import React, { useState, useMemo } from "react";

type CalendarView = "day" | "week" | "month";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  recurring?: "none" | "daily" | "weekly" | "monthly";
  color?: string;
};

const STORAGE_KEY = "k_ai_calendar_v1";

export default function Calendar() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw) as CalendarEvent[];
    } catch {
      /* ignore */
    }
    return [];
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  function addEvent(event: Omit<CalendarEvent, "id">) {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowAddEvent(false);
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  function getEventsForDate(dateStr: string) {
    return events.filter((e) => e.date === dateStr);
  }

  function nextPeriod() {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  }

  function prevPeriod() {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  }

  function today() {
    setCurrentDate(new Date());
  }

  const displayTitle = useMemo(() => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (view === "week") {
      return `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  }, [view, currentDate]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Calendar</h2>
        <button
          onClick={() => {
            setSelectedDate(new Date().toISOString().split("T")[0]);
            setShowAddEvent(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Add Event
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevPeriod} className="px-3 py-1 border border-border rounded-md">
            ←
          </button>
          <button onClick={today} className="px-3 py-1 border border-border rounded-md">
            Today
          </button>
          <button onClick={nextPeriod} className="px-3 py-1 border border-border rounded-md">
            →
          </button>
          <span className="ml-3 font-semibold">{displayTitle}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1 rounded-md ${view === "day" ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 rounded-md ${view === "week" ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 rounded-md ${view === "month" ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            Month
          </button>
        </div>
      </div>

      {view === "month" && (
        <MonthView
          monthDays={monthDays}
          currentDate={currentDate}
          events={events}
          getEventsForDate={getEventsForDate}
          onDateClick={(date) => {
            setSelectedDate(date);
            setShowAddEvent(true);
          }}
          onDeleteEvent={deleteEvent}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onDateClick={(date) => {
            setSelectedDate(date);
            setShowAddEvent(true);
          }}
          onDeleteEvent={deleteEvent}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={events}
          onDeleteEvent={deleteEvent}
        />
      )}

      {showAddEvent && (
        <AddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowAddEvent(false)}
          onAdd={addEvent}
        />
      )}
    </div>
  );
}

function MonthView({
  monthDays,
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  onDeleteEvent,
}: {
  monthDays: (number | null)[];
  currentDate: Date;
  events: CalendarEvent[];
  getEventsForDate: (date: string) => CalendarEvent[];
  onDateClick: (date: string) => void;
  onDeleteEvent: (id: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="border-b border-r border-border p-2 h-24 bg-muted/20" />;
          }

          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = getEventsForDate(dateStr);

          return (
            <div
              key={i}
              className="border-b border-r border-border p-2 h-24 cursor-pointer hover:bg-accent/10"
              onClick={() => onDateClick(dateStr)}
            >
              <div className="text-sm font-medium mb-1">{day}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-1 py-0.5 bg-primary/20 rounded truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  events,
  onDateClick,
  onDeleteEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: string) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center">
            <div className="text-sm font-semibold">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className="text-lg">{day.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = day.toISOString().split("T")[0];
          const dayEvents = events.filter((e) => e.date === dateStr);

          return (
            <div
              key={dateStr}
              className="border-r border-border p-2 min-h-[200px] cursor-pointer hover:bg-accent/10"
              onClick={() => onDateClick(dateStr)}
            >
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-1 bg-primary/20 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-muted-foreground">
                      {event.startTime} - {event.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  events,
  onDeleteEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDeleteEvent: (id: string) => void;
}) {
  const dateStr = currentDate.toISOString().split("T")[0];
  const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="space-y-3">
        {dayEvents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No events scheduled for this day</p>
        )}
        {dayEvents.map((event) => (
          <div key={event.id} className="border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-lg">{event.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {event.startTime} - {event.endTime}
                </div>
                {event.description && (
                  <div className="mt-2 text-sm">{event.description}</div>
                )}
                {event.recurring !== "none" && (
                  <div className="mt-2 text-xs bg-accent/20 px-2 py-1 rounded inline-block">
                    Repeats {event.recurring}
                  </div>
                )}
              </div>
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddEventModal({
  selectedDate,
  onClose,
  onAdd,
}: {
  selectedDate: string;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onAdd({
      title: title.trim(),
      date,
      startTime,
      endTime,
      description: description.trim(),
      recurring,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">Add Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Recurring</label>
            <select
              value={recurring}
              onChange={(e) => setRecurring(e.target.value as "none" | "daily" | "weekly" | "monthly")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}