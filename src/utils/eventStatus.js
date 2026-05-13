// Event status helpers

const THREE_HOURS_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds (increased from 3 hours)

/**
 * Check if event should be auto-stopped (more than 6 hours since event start)
 */
export function shouldAutoStop(event) {
  if (!event.isActive) return false; // Already stopped
  
  // Get event start time
  const eventDate = event.date; // Format: "2026-05-07"
  const eventTime = event.timeStart; // Format: "09:00 AM"
  
  if (!eventDate || !eventTime) return false;
  
  // Parse date and time
  const [timePart, modifier] = eventTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(s => parseInt(s.trim(), 10));
  
  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const [year, month, day] = eventDate.split('-').map(s => parseInt(s, 10));
  
  // Create event start datetime
  const eventStartTime = new Date(year, month - 1, day, hours, minutes || 0);
  
  // Check if event was created today
  const now = new Date();
  const eventDay = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // If event is from a different day, auto-stop it
  if (eventDay.getTime() !== today.getTime()) {
    return true;
  }
  
  // Check if more than 6 hours have passed since event start
  const timeDiff = now.getTime() - eventStartTime.getTime();
  return timeDiff > THREE_HOURS_MS;
}

/**
 * Check if event can be resumed (stopped less than 3 hours ago)
 */
export function canResumeEvent(event) {
  // Must be active and paused to resume
  if (!event.isActive || !event.isPaused) return false;
  
  // Check if event is within 6 hours window
  const eventDate = event.date;
  const eventTime = event.timeStart;
  
  if (!eventDate || !eventTime) return false;
  
  const [timePart, modifier] = eventTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(s => parseInt(s.trim(), 10));
  
  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const [year, month, day] = eventDate.split('-').map(s => parseInt(s, 10));
  
  const eventStartTime = new Date(year, month - 1, day, hours, minutes || 0);
  const now = new Date();
  
  const timeDiff = now.getTime() - eventStartTime.getTime();
  return timeDiff <= THREE_HOURS_MS;
}

/**
 * Check if stopped event can still be resumed (within 6 hours)
 */
export function canRestartStoppedEvent(event) {
  // Only for stopped events that were paused
  if (event.isActive) return false;
  if (!event.isPaused) return false; // Was properly ended, not paused
  
  const eventDate = event.date;
  const eventTime = event.timeStart;
  
  if (!eventDate || !eventTime) return false;
  
  const [timePart, modifier] = eventTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(s => parseInt(s.trim(), 10));
  
  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const [year, month, day] = eventDate.split('-').map(s => parseInt(s, 10));
  
  const eventStartTime = new Date(year, month - 1, day, hours, minutes || 0);
  const now = new Date();
  
  const timeDiff = now.getTime() - eventStartTime.getTime();
  return timeDiff <= THREE_HOURS_MS;
}
