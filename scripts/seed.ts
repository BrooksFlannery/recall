import dotenv from 'dotenv';
import { db } from '../src/server/db/client';
import {
  notebooks,
  notes,
  categories,
  noteCategories,
  questions,
  quizzes,
  answers,
} from '../src/server/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Seeding database...');

  // Create a test user ID (in real app, this would come from BetterAuth)
  const { randomUUID } = await import('crypto');
  const testUserId = randomUUID();

  // Create notebooks
  const [notebook1] = await db
    .insert(notebooks)
    .values([
      {
        userId: testUserId,
        name: 'Computer Science Fundamentals',
        description: 'Core CS concepts and algorithms',
      },
      {
        userId: testUserId,
        name: 'Web Development',
        description: 'Frontend and backend development notes',
      },
    ])
    .returning();

  console.log('✅ Created notebooks');

  // Create notes
  const [note1, note2, note3] = await db
    .insert(notes)
    .values([
      {
        userId: testUserId,
        notebookId: notebook1.id,
        text: 'A binary tree is a tree data structure where each node has at most two children.',
      },
      {
        userId: testUserId,
        notebookId: notebook1.id,
        text: 'Big O notation describes the worst-case time complexity of an algorithm.',
      },
      {
        userId: testUserId,
        notebookId: notebook1.id,
        text: 'Recursion is a programming technique where a function calls itself.',
      },
    ])
    .returning();

  console.log('✅ Created notes');

  // Create categories
  const [category1, category2] = await db
    .insert(categories)
    .values([
      {
        userId: testUserId,
        notebookId: notebook1.id,
        name: 'Data Structures',
      },
      {
        userId: testUserId,
        notebookId: notebook1.id,
        name: 'Algorithms',
      },
    ])
    .returning();

  console.log('✅ Created categories');

  // Associate notes with categories
  await db.insert(noteCategories).values([
    { noteId: note1.id, categoryId: category1.id },
    { noteId: note1.id, categoryId: category2.id },
    { noteId: note2.id, categoryId: category2.id },
    { noteId: note3.id, categoryId: category2.id },
  ]);

  console.log('✅ Created note-category associations');

  // Create questions for notes
  const [question1, question2] = await db
    .insert(questions)
    .values([
      {
        noteId: note1.id,
        questionText: 'What is a binary tree and how many children can each node have?',
        difficulty: 0.5,
      },
      {
        noteId: note2.id,
        questionText: 'Explain Big O notation and what it represents.',
        difficulty: 0.7,
      },
    ])
    .returning();

  console.log('✅ Created questions');

  // Create a quiz
  const [quiz1] = await db
    .insert(quizzes)
    .values([
      {
        userId: testUserId,
        notebookId: notebook1.id,
        finishedAt: new Date(),
        score: 85.5,
        analysis: { totalQuestions: 2, correctAnswers: 1 },
      },
    ])
    .returning();

  console.log('✅ Created quiz');

  // Create answers
  await db.insert(answers).values([
    {
      quizId: quiz1.id,
      noteId: note1.id,
      questionId: question1.id,
      userId: testUserId,
      correct: true,
      confidence: 0.9,
      difficulty: 0.5,
    },
    {
      quizId: quiz1.id,
      noteId: note2.id,
      questionId: question2.id,
      userId: testUserId,
      correct: false,
      confidence: 0.6,
      difficulty: 0.7,
    },
  ]);

  console.log('✅ Created answers');
  console.log('🎉 Seeding completed!');
  console.log(`Test User ID: ${testUserId}`);
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

