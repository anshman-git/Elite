/**
 * INTEGRATION EXAMPLES
 * 
 * This file shows practical examples of how to integrate the new interactive
 * components into your existing screens (Dashboard, Quizzes, etc.)
 */

// ============================================================================
// EXAMPLE 1: Enhance Dashboard with Interactive Stats
// ============================================================================

/**
 * Enhanced Dashboard Stats Section
 * 
 * Usage:
 * import { DashboardStatsSection } from './examples/integration-examples';
 * 
 * <DashboardStatsSection userStats={stats} />
 */
export function DashboardStatsSection({ userStats }) {
  import { StatsCard } from '../components/InteractiveElements';
  import { Trophy, Zap, Target, Flame } from 'lucide-react';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        icon={Trophy}
        label="Rank"
        value={`#${userStats.rank}`}
        trend={userStats.rankTrend}
        trendPositive={userStats.rankTrend > 0}
      />
      <StatsCard
        icon={Zap}
        label="Total XP"
        value={userStats.totalXp.toLocaleString()}
        trend={`+${userStats.xpGain} this week`}
        trendPositive={true}
      />
      <StatsCard
        icon={Target}
        label="Accuracy"
        value={`${userStats.accuracy}%`}
        trend={`${userStats.accuracyTrend > 0 ? '+' : ''}${userStats.accuracyTrend}%`}
        trendPositive={userStats.accuracyTrend > 0}
      />
      <StatsCard
        icon={Flame}
        label="Streak"
        value={`${userStats.streak} days`}
        trend="Keep it up!"
        trendPositive={true}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Enhanced Quiz Selection Screen
// ============================================================================

/**
 * Enhanced Quiz Card with Interactive Hover
 * 
 * Features:
 * - Animated hover effects
 * - Progress ring indicator
 * - Interactive difficulty slider
 * - Smooth transitions
 */
export function EnhancedQuizCard({ quiz, onStart, onViewResults }) {
  import { useState } from 'react';
  import { motion } from 'framer-motion';
  import { Card, Button, Badge } from '../components/ui';
  import { ProgressRing } from '../components/InteractiveElements';
  import { Play, BarChart3 } from 'lucide-react';
  
  const [isHovered, setIsHovered] = useState(false);

  const difficultyColor = {
    easy: 'emerald',
    medium: 'amber',
    hard: 'rose',
  }[quiz.difficulty] || 'amber';

  return (
    <Card
      interactive
      hover="lift"
      className="overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient animation */}
      <motion.div
        className="absolute inset-0 opacity-0 blur-xl"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        style={{ background: `linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)` }}
      />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-ink-100 mb-1 font-display">
              {quiz.title}
            </h3>
            <p className="text-xs text-ink-400 mb-2">{quiz.description}</p>
            <div className="flex gap-2">
              <Badge variant="default" className="capitalize">
                {quiz.difficulty}
              </Badge>
              <Badge variant="info">{quiz.questionCount} questions</Badge>
            </div>
          </div>
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <ProgressRing
              percentage={quiz.completionPercentage || 0}
              color={difficultyColor}
              radius={40}
            />
          </motion.div>
        </div>

        {/* Progress bar */}
        {quiz.completedCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Progress</span>
              <span className="text-amber-500 font-semibold">
                {quiz.completedCount}/{quiz.totalAttempts}
              </span>
            </div>
            <div className="h-2 bg-bg-raised rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                animate={{
                  width: `${(quiz.completedCount / quiz.totalAttempts) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="primary"
            className="flex-1 gap-2"
            onClick={() => onStart(quiz.id)}
          >
            <Play size={16} />
            {quiz.completedCount > 0 ? 'Retry' : 'Start'}
          </Button>
          {quiz.completedCount > 0 && (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => onViewResults(quiz.id)}
            >
              <BarChart3 size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 3: Enhanced Settings/Preferences Form
// ============================================================================

/**
 * Enhanced Settings Form with all interactive elements
 */
export function EnhancedSettingsForm({ settings, onSave }) {
  import { useState } from 'react';
  import { Card, Button, Input, Tabs } from '../components/ui';
  import {
    AnimatedCheckbox,
    AnimatedSwitch,
    AnimatedDropdown,
    AnimatedSlider,
    ProgressRing,
  } from '../components/InteractiveElements';
  import { Bell, Moon, Volume2, Eye } from 'lucide-react';

  const [formData, setFormData] = useState(settings);
  const [activeTab, setActiveTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSave?.(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const tabs = [
    {
      label: 'Display',
      content: (
        <div className="space-y-6">
          <AnimatedSwitch
            enabled={formData.darkMode}
            onChange={(v) => setFormData({ ...formData, darkMode: v })}
            label="Dark Mode"
          />
          <AnimatedSlider
            value={formData.uiScale}
            onChange={(v) => setFormData({ ...formData, uiScale: v })}
            min={80}
            max={120}
            label="UI Scale (%)"
          />
          <AnimatedDropdown
            items={[
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
            ]}
            value={formData.language}
            onChange={(v) => setFormData({ ...formData, language: v })}
            placeholder="Select language"
          />
        </div>
      ),
    },
    {
      label: 'Notifications',
      content: (
        <div className="space-y-4">
          <AnimatedCheckbox
            checked={formData.emailNotifications}
            onChange={(v) => setFormData({ ...formData, emailNotifications: v })}
            label="Email Notifications"
          />
          <AnimatedCheckbox
            checked={formData.pushNotifications}
            onChange={(v) => setFormData({ ...formData, pushNotifications: v })}
            label="Push Notifications"
          />
          <AnimatedCheckbox
            checked={formData.soundEnabled}
            onChange={(v) => setFormData({ ...formData, soundEnabled: v })}
            label="Sound Effects"
          />
          <AnimatedSlider
            value={formData.soundVolume}
            onChange={(v) => setFormData({ ...formData, soundVolume: v })}
            label="Volume"
          />
        </div>
      ),
    },
    {
      label: 'Learning',
      content: (
        <div className="space-y-6">
          <AnimatedDropdown
            items={[
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' },
            ]}
            value={formData.defaultDifficulty}
            onChange={(v) => setFormData({ ...formData, defaultDifficulty: v })}
          />
          <AnimatedSlider
            value={formData.sessionsPerDay}
            onChange={(v) => setFormData({ ...formData, sessionsPerDay: v })}
            min={1}
            max={10}
            label="Target Sessions Per Day"
          />
          <AnimatedCheckbox
            checked={formData.randomOrder}
            onChange={(v) => setFormData({ ...formData, randomOrder: v })}
            label="Randomize Question Order"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          {saveSuccess ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Enhanced Leaderboard with Interactive Elements
// ============================================================================

/**
 * Enhanced Leaderboard Row with hover effects
 */
export function EnhancedLeaderboardRow({ user, rank, isYou }) {
  import { motion } from 'framer-motion';
  import { Card } from '../components/ui';
  import { Trophy, Flame } from 'lucide-react';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ x: 4 }}
    >
      <Card
        interactive
        className={`flex items-center gap-4 ${isYou ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
      >
        {/* Rank Badge */}
        <motion.div
          className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg"
          whileHover={{ scale: 1.1 }}
        >
          {rank}
        </motion.div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink-100 truncate">{user.name}</p>
          <p className="text-xs text-ink-400">{user.title}</p>
        </div>

        {/* Stats */}
        <motion.div
          className="flex-shrink-0 flex items-center gap-4"
          animate={{ opacity: 1 }}
        >
          <div className="text-right">
            <motion.p
              className="text-lg font-black text-amber-500"
              animate={{ opacity: 1 }}
            >
              {user.xp.toLocaleString()}
            </motion.p>
            <p className="text-xs text-ink-400">XP</p>
          </div>
          {user.streak > 0 && (
            <motion.div
              className="flex items-center gap-1 text-rose-500"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame size={16} />
              <span className="font-bold">{user.streak}</span>
            </motion.div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// EXAMPLE 5: Enhanced Loading State
// ============================================================================

/**
 * Enhanced content loader with skeleton states
 */
export function EnhancedContentLoader({ isLoading, children }) {
  import { PulsingSkeleton } from '../components/InteractiveElements';
  import { Card } from '../components/ui';

  if (isLoading) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <PulsingSkeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <PulsingSkeleton className="h-4 w-2/3" />
            <PulsingSkeleton className="h-4 w-1/2" />
          </div>
        </div>
        <PulsingSkeleton className="h-24" />
        <div className="grid grid-cols-3 gap-2">
          <PulsingSkeleton className="h-16" />
          <PulsingSkeleton className="h-16" />
          <PulsingSkeleton className="h-16" />
        </div>
      </Card>
    );
  }

  return children;
}

// ============================================================================
// USAGE IN YOUR APP
// ============================================================================

/**
 * Example: Integrate into Dashboard.jsx
 * 
 * import { DashboardStatsSection, EnhancedQuizCard, EnhancedContentLoader } from './integration-examples';
 * 
 * function Dashboard() {
 *   return (
 *     <div className="space-y-6">
 *       <DashboardStatsSection userStats={userStats} />
 *       
 *       <h2>Your Quizzes</h2>
 *       <EnhancedContentLoader isLoading={loading}>
 *         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 *           {quizzes.map(quiz => (
 *             <EnhancedQuizCard
 *               key={quiz.id}
 *               quiz={quiz}
 *               onStart={handleStartQuiz}
 *               onViewResults={handleViewResults}
 *             />
 *           ))}
 *         </div>
 *       </EnhancedContentLoader>
 *     </div>
 *   );
 * }
 */

export const INTEGRATION_EXAMPLES = {
  Dashboard: 'DashboardStatsSection',
  QuizSelection: 'EnhancedQuizCard',
  Settings: 'EnhancedSettingsForm',
  Leaderboard: 'EnhancedLeaderboardRow',
  LoadingStates: 'EnhancedContentLoader',
};
