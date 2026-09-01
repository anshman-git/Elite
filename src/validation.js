export const VALIDATION_RULES = {
  QUIZ_TITLE_MAX: 200,
  QUESTION_MAX: 1000,
  OPTION_MAX: 500,
  EXPLANATION_MAX: 2000,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6,
  MIN_QUIZ_QUESTIONS: 1,
  MAX_QUIZ_QUESTIONS: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
};

export function validateEmail(email) {
  if (!email?.trim()) {
    return 'Email is required';
  }
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return 'Invalid email address';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validateName(name) {
  if (!name?.trim()) {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (name.length > 100) {
    return 'Name must be less than 100 characters';
  }
  return null;
}

export function validateQuiz(quiz) {
  const errors = [];

  // Validate title
  if (!quiz.title?.trim()) {
    errors.push('Quiz title is required');
  } else if (quiz.title.length > VALIDATION_RULES.QUIZ_TITLE_MAX) {
    errors.push(`Quiz title must be under ${VALIDATION_RULES.QUIZ_TITLE_MAX} characters`);
  }

  // Validate questions array
  if (!quiz.questions?.length) {
    errors.push('At least 1 question is required');
  } else if (quiz.questions.length > VALIDATION_RULES.MAX_QUIZ_QUESTIONS) {
    errors.push(`Maximum ${VALIDATION_RULES.MAX_QUIZ_QUESTIONS} questions allowed`);
  }

  // Validate each question
  quiz.questions?.forEach((q, idx) => {
    if (!q.question?.trim()) {
      errors.push(`Question ${idx + 1}: Question text is required`);
    } else if (q.question.length > VALIDATION_RULES.QUESTION_MAX) {
      errors.push(`Question ${idx + 1}: Too long (max ${VALIDATION_RULES.QUESTION_MAX} chars)`);
    }

    const options = (q.options || []).filter((opt) => opt?.trim());
    if (options.length < VALIDATION_RULES.MIN_OPTIONS) {
      errors.push(`Question ${idx + 1}: At least ${VALIDATION_RULES.MIN_OPTIONS} options required`);
    } else if (options.length > VALIDATION_RULES.MAX_OPTIONS) {
      errors.push(`Question ${idx + 1}: Maximum ${VALIDATION_RULES.MAX_OPTIONS} options allowed`);
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options.map((opt) => opt.toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      errors.push(`Question ${idx + 1}: Options must be unique`);
    }

    if (!q.answer?.trim()) {
      errors.push(`Question ${idx + 1}: Correct answer is required`);
    } else if (!options.includes(q.answer.trim())) {
      errors.push(`Question ${idx + 1}: Answer must match an option exactly`);
    }

    if (q.explanation && q.explanation.length > VALIDATION_RULES.EXPLANATION_MAX) {
      errors.push(`Question ${idx + 1}: Explanation is too long`);
    }
  });

  return errors;
}

export function validateFile(file) {
  if (!file) {
    return 'File is required';
  }

  if (file.size > VALIDATION_RULES.MAX_FILE_SIZE) {
    return `File too large. Maximum size: 50MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }

  if (!VALIDATION_RULES.ALLOWED_FILE_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${VALIDATION_RULES.ALLOWED_FILE_TYPES.join(', ')}`;
  }

  return null;
}