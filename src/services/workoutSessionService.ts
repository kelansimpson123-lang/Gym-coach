import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId, nowISO } from '../utils/id'
import { updateExerciseWorkingWeight } from './exerciseService'
import type { Exercise, SessionExercise, WorkoutSession } from '../models'

export async function getSessionByDate(date: string): Promise<WorkoutSession | undefined> {
  const db = await getDB()
  const matches = await db.getAllFromIndex(STORES.workoutSessions, 'by-date', date)
  return matches[0]
}

/** Most recent sessions first — used by the workout generator to see what
 * was trained recently, for rotation. */
export async function getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  const db = await getDB()
  const all = await db.getAll(STORES.workoutSessions)
  return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

export async function saveSession(session: WorkoutSession): Promise<WorkoutSession> {
  const db = await getDB()
  await db.put(STORES.workoutSessions, session)
  return session
}

export async function createSession(
  date: string,
  splitId: string,
  exercises: SessionExercise[],
): Promise<WorkoutSession> {
  const session: WorkoutSession = {
    id: generateId(),
    date,
    splitId,
    exercises,
    isCompleted: false,
    createdAt: nowISO(),
  }
  return saveSession(session)
}

export async function addExerciseToSession(
  session: WorkoutSession,
  exercise: Exercise,
): Promise<WorkoutSession> {
  const entry: SessionExercise = {
    exerciseId: exercise.id,
    workingWeight: exercise.currentWorkingWeight,
    completed: false,
  }
  return saveSession({ ...session, exercises: [...session.exercises, entry] })
}

export async function removeExerciseAt(
  session: WorkoutSession,
  index: number,
): Promise<WorkoutSession> {
  const exercises = session.exercises.filter((_, i) => i !== index)
  return saveSession({ ...session, exercises })
}

export async function swapExerciseAt(
  session: WorkoutSession,
  index: number,
  newExercise: Exercise,
): Promise<WorkoutSession> {
  const exercises = session.exercises.map((entry, i) =>
    i === index
      ? { exerciseId: newExercise.id, workingWeight: newExercise.currentWorkingWeight, completed: false }
      : entry,
  )
  return saveSession({ ...session, exercises })
}

/** Updates the weight for this session's entry and keeps the exercise's
 * canonical working weight in sync, since the spec treats "change weight"
 * as updating the current working weight, not just today's snapshot. */
export async function updateSessionExerciseWeight(
  session: WorkoutSession,
  index: number,
  weight: number | 'bodyweight',
): Promise<WorkoutSession> {
  const target = session.exercises[index]
  if (target) {
    await updateExerciseWorkingWeight(target.exerciseId, weight)
  }
  const exercises = session.exercises.map((entry, i) =>
    i === index ? { ...entry, workingWeight: weight } : entry,
  )
  return saveSession({ ...session, exercises })
}

export async function toggleExerciseCompleted(
  session: WorkoutSession,
  index: number,
): Promise<WorkoutSession> {
  const exercises = session.exercises.map((entry, i) =>
    i === index ? { ...entry, completed: !entry.completed } : entry,
  )
  return saveSession({ ...session, exercises })
}
