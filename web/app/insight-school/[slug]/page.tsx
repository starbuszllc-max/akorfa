'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Brain, BookOpen, Users, Crown, Zap, ChevronLeft, ChevronRight,
  CheckCircle, Play, Sparkles, MessageCircle, Send, Loader2, X
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string;
  keyTakeaways: string[];
  examples: string[];
  estimatedMinutes: number;
}

interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

const TRACKS_DATA: { [key: string]: Track } = {
  'human-behavior-os': {
    id: '1',
    name: 'Human Behavior OS',
    slug: 'human-behavior-os',
    description: 'Understand the operating system that runs inside every human being.',
    icon: 'brain',
    color: '#8b5cf6',
    lessons: [
      {
        id: 'hb-1',
        title: 'Why We Do What We Do',
        content: `Every action you take is driven by something deeper. Think of your brain like a smartphone - it has an operating system running behind the scenes, making decisions before you're even aware of them.

Your behavior is shaped by three main forces:
1. **Survival instincts** - Your brain's #1 job is keeping you alive. This is why you feel fear, hunger, and the urge to belong to groups.
2. **Emotional needs** - We all need to feel loved, respected, and significant. Many of our actions are attempts to meet these needs.
3. **Mental shortcuts** - Your brain uses quick rules (called heuristics) to make fast decisions without thinking too hard.

Understanding these forces helps you see why people act the way they do - including yourself.`,
        keyTakeaways: [
          'Your brain prioritizes survival above all else',
          'Emotions drive most of our decisions, not logic',
          'Mental shortcuts save energy but can lead to mistakes'
        ],
        examples: [
          'Why you check your phone constantly (seeking social validation)',
          'Why criticism hurts so much (threatens our sense of belonging)',
          'Why we procrastinate on hard tasks (brain avoids discomfort)'
        ],
        estimatedMinutes: 8
      },
      {
        id: 'hb-2',
        title: 'The Power of Perception',
        content: `Here's a mind-bending truth: You don't see reality as it is. You see reality as YOU are.

Your brain doesn't show you the world directly. Instead, it creates a "mental movie" based on:
- What you pay attention to
- Your past experiences and memories
- Your current emotional state
- Your beliefs and expectations

This explains why two people can witness the same event and have completely different memories of it. Neither is lying - they simply perceived it differently.

**The good news?** Once you understand this, you become less judgmental of others and more curious about how they see the world.`,
        keyTakeaways: [
          'Perception is not reality - it\'s your brain\'s interpretation',
          'Your mood affects what you notice and remember',
          'Everyone lives in their own mental movie'
        ],
        examples: [
          'Why eyewitness testimony is often unreliable',
          'Why you notice your new car everywhere after buying it',
          'Why optimists and pessimists see the same situation differently'
        ],
        estimatedMinutes: 7
      },
      {
        id: 'hb-3',
        title: 'Cognitive Biases: Your Brain\'s Bugs',
        content: `Your brain is amazing, but it has "bugs" - predictable errors in thinking called cognitive biases. Here are the most important ones:

**Confirmation Bias** - You tend to notice and believe information that matches what you already think, while ignoring contradicting evidence.

**Loss Aversion** - Losing something feels about twice as painful as gaining the same thing feels good. This is why people fear change.

**The Halo Effect** - If you like one thing about a person (like their looks), you automatically assume other good things about them.

**Anchoring** - The first piece of information you hear heavily influences your judgment, even if it's irrelevant.

These aren't character flaws - they're how all human brains work. Awareness is the first step to working around them.`,
        keyTakeaways: [
          'Cognitive biases affect everyone, including you',
          'These "bugs" were useful for survival but cause problems today',
          'Awareness of biases helps you make better decisions'
        ],
        examples: [
          'Why you think your political views are obviously correct',
          'Why sales "discounts" work so well (anchoring)',
          'Why first impressions matter so much (halo effect)'
        ],
        estimatedMinutes: 10
      },
      {
        id: 'hb-4',
        title: 'Emotions: Your Internal GPS',
        content: `Emotions aren't weaknesses - they're your internal navigation system. They evolved to help you survive and thrive.

**Fear** tells you something might be dangerous. It's trying to protect you.

**Anger** signals that a boundary has been crossed. It mobilizes energy for action.

**Sadness** indicates loss and invites others to comfort you. It helps you slow down and process.

**Joy** marks experiences as valuable, encouraging you to repeat them.

**Disgust** protects you from things that could harm you (spoiled food, toxic people).

The goal isn't to eliminate emotions, but to:
1. Recognize what you're feeling
2. Understand what the emotion is trying to tell you
3. Choose how to respond rather than react automatically`,
        keyTakeaways: [
          'Every emotion has a purpose and a message',
          'Emotions are signals, not commands',
          'Emotional intelligence = recognizing, understanding, and managing emotions'
        ],
        examples: [
          'Anxiety before a presentation = your body preparing for performance',
          'Anger at injustice = motivation to create change',
          'Nostalgia = a reminder of what you value'
        ],
        estimatedMinutes: 8
      },
      {
        id: 'hb-5',
        title: 'Decision Making: How We Really Choose',
        content: `Think you make logical decisions? Science says otherwise. Most decisions happen in three stages:

**1. Emotion decides** - Your gut feeling or emotional brain makes a quick judgment
**2. Logic justifies** - Your rational brain creates reasons to support that gut feeling  
**3. You believe it was rational** - You convince yourself the decision was purely logical

This isn't a flaw - it's efficient. You can't analyze every decision deeply. The key is knowing when to trust your gut (familiar situations) versus when to slow down and think (important or unfamiliar choices).

**Practical tip:** For big decisions, write down your gut reaction, then deliberately argue the opposite side. If your original choice still feels right, go with it.`,
        keyTakeaways: [
          'Emotions usually decide first, logic justifies second',
          'This system is efficient for routine decisions',
          'Important decisions benefit from deliberate analysis'
        ],
        examples: [
          'Why you buy things and then rationalize the purchase',
          'Why people defend decisions even when proven wrong',
          'Why "sleeping on it" helps you make better choices'
        ],
        estimatedMinutes: 9
      }
    ]
  },
  'social-systems-os': {
    id: '2',
    name: 'Social Systems OS',
    slug: 'social-systems-os',
    description: 'Learn how communities build trust, maintain cohesion, and govern themselves.',
    icon: 'users',
    color: '#06b6d4',
    lessons: [
      {
        id: 'ss-1',
        title: 'Why Humans Form Groups',
        content: `Humans are ultra-social creatures. Unlike other animals, we can cooperate with strangers on a massive scale. This is our superpower.

**Groups provided survival advantages:**
- Protection from predators and enemies
- Sharing of food, shelter, and knowledge
- Division of labor (specialists could emerge)
- Collective problem-solving

But here's the deeper truth: Your brain is wired to NEED social connection. Loneliness activates the same brain regions as physical pain. Social rejection literally hurts.

This explains why people do seemingly irrational things to fit in - your brain treats exclusion as a survival threat.`,
        keyTakeaways: [
          'Social connection is a biological need, not just a preference',
          'Groups enabled humans to dominate the planet',
          'Your brain treats social rejection like physical danger'
        ],
        examples: [
          'Why solitary confinement is considered cruel punishment',
          'Why teenagers are so sensitive to peer pressure',
          'Why social media is so addictive (exploits our need for connection)'
        ],
        estimatedMinutes: 7
      },
      {
        id: 'ss-2',
        title: 'Trust: The Invisible Foundation',
        content: `Trust is the invisible infrastructure that makes society work. Without it, everything falls apart.

**Trust works in layers:**
1. **Personal trust** - Between individuals who know each other
2. **Institutional trust** - In organizations, governments, and systems
3. **Generalized trust** - Willingness to trust strangers

High-trust societies have better economies, less crime, more cooperation, and happier citizens. Low-trust societies spend enormous energy on protection, contracts, and enforcement.

**Trust is built slowly and broken quickly.** It takes many positive interactions to build, but just one betrayal to destroy. This is why consistency matters so much.`,
        keyTakeaways: [
          'Trust is the foundation of all cooperation',
          'High-trust societies outperform low-trust ones',
          'Trust is built in drops but lost in buckets'
        ],
        examples: [
          'Why handshake deals worked in small villages but not big cities',
          'Why corruption destroys economic development',
          'Why online reviews matter so much (trust proxies)'
        ],
        estimatedMinutes: 8
      },
      {
        id: 'ss-3',
        title: 'Social Norms: The Unwritten Rules',
        content: `Every group has unwritten rules that members follow. These are social norms - and they're incredibly powerful.

**Types of norms:**
- **Descriptive norms** - What most people actually do
- **Injunctive norms** - What people think you SHOULD do
- **Personal norms** - Your own internal standards

Norms are enforced through:
- Approval and belonging (following norms)
- Shame and exclusion (breaking norms)

The fascinating part: Norms change when people believe others are changing. This is how social movements work - they shift perceptions of what's "normal."`,
        keyTakeaways: [
          'Unwritten rules often matter more than written ones',
          'Norms are enforced through social approval and shame',
          'Changing perceived norms can change actual behavior'
        ],
        examples: [
          'Why recycling increased when people saw neighbors doing it',
          'Why workplace culture is so hard to change',
          'How social media creates new norms rapidly'
        ],
        estimatedMinutes: 8
      },
      {
        id: 'ss-4',
        title: 'Cooperation and Free Riders',
        content: `Cooperation creates enormous value, but it faces a constant threat: free riders.

**The Free Rider Problem:**
If everyone cooperates, the group benefits. But individuals can benefit even MORE by letting others do the work. If too many people free ride, cooperation collapses.

**Solutions that work:**
1. **Reputation systems** - Track who cooperates and who doesn't
2. **Reciprocity** - Only cooperate with those who cooperate back
3. **Punishment** - Consequences for free riding
4. **Identity** - Strong group identity makes free riding feel like self-betrayal

Successful communities balance these mechanisms to maintain cooperation while not becoming oppressive.`,
        keyTakeaways: [
          'Cooperation creates value but is vulnerable to exploitation',
          'Free riding can destroy cooperative systems',
          'Reputation, reciprocity, and identity help maintain cooperation'
        ],
        examples: [
          'Why open-source software works (reputation and identity)',
          'Why some neighborhoods stay clean while others don\'t',
          'How rating systems enable trust between strangers'
        ],
        estimatedMinutes: 9
      }
    ]
  },
  'leadership-os': {
    id: '3',
    name: 'Leadership OS',
    slug: 'leadership-os',
    description: 'Master influence, power dynamics, and ethical leadership.',
    icon: 'crown',
    color: '#f59e0b',
    lessons: [
      {
        id: 'lo-1',
        title: 'What Leadership Really Is',
        content: `Leadership isn't about titles or authority. It's about influence - the ability to move people toward a shared goal.

**True leadership means:**
- Seeing a possibility others don't yet see
- Communicating that vision compellingly
- Helping others believe they can achieve it
- Taking responsibility when things go wrong

**Anyone can lead** from any position. You lead when you speak up in a meeting, when you help a struggling colleague, when you model the behavior you want to see.

The most powerful leaders don't just command - they inspire. They don't just direct - they develop others.`,
        keyTakeaways: [
          'Leadership is about influence, not authority',
          'Anyone can lead from any position',
          'Great leaders inspire and develop others'
        ],
        examples: [
          'How junior employees can lead upward',
          'Why some managers have authority but no influence',
          'How movements are led by ordinary people who step up'
        ],
        estimatedMinutes: 7
      },
      {
        id: 'lo-2',
        title: 'Power: Understanding the Game',
        content: `Power is simply the ability to influence outcomes. It's not inherently good or bad - it depends on how it's used.

**Sources of power:**
1. **Position power** - Authority from your role
2. **Expert power** - Knowledge and skills others need
3. **Relationship power** - Network and connections
4. **Referent power** - Personal charisma and likability
5. **Coercive power** - Ability to punish (least sustainable)

**Key insight:** People with the most sustainable power combine multiple sources. They're liked AND respected AND skilled AND well-connected.

Understanding power dynamics helps you navigate organizations, build influence ethically, and recognize when others are using power tactics on you.`,
        keyTakeaways: [
          'Power is neutral - it depends on how you use it',
          'Multiple sources of power create sustainable influence',
          'Understanding power helps you navigate complex situations'
        ],
        examples: [
          'Why some experts have no influence (lacking relationship power)',
          'How new leaders can build power quickly',
          'Why charisma alone isn\'t enough for lasting leadership'
        ],
        estimatedMinutes: 9
      },
      {
        id: 'lo-3',
        title: 'Vision: Painting the Future',
        content: `A leader's job is to help people see a future worth working toward. This is vision.

**Effective visions are:**
- **Specific enough** to guide decisions
- **Inspiring enough** to motivate action
- **Realistic enough** to be believable
- **Meaningful enough** to matter

The best visions connect personal meaning to collective purpose. They answer: "Why should I care? What's in it for me AND the greater good?"

**Vision without execution is hallucination.** Leaders must translate big dreams into concrete steps, milestones, and accountability.`,
        keyTakeaways: [
          'Vision gives direction and motivation',
          'Good visions balance inspiration with believability',
          'Vision must be connected to execution'
        ],
        examples: [
          'JFK\'s "moon by end of decade" - specific and inspiring',
          'How startups use vision to attract talent despite low pay',
          'Why vague mission statements don\'t motivate anyone'
        ],
        estimatedMinutes: 8
      },
      {
        id: 'lo-4',
        title: 'Ethical Leadership',
        content: `Power can corrupt. Ethical leadership requires conscious effort to stay grounded.

**Principles of ethical leadership:**
1. **Transparency** - Be honest about your reasoning and mistakes
2. **Fairness** - Apply standards consistently, not based on favorites
3. **Responsibility** - Own the outcomes, especially the bad ones
4. **Service** - Lead for the benefit of followers, not just yourself
5. **Humility** - Stay open to feedback and course correction

**The ultimate test:** Would you be proud if your leadership decisions were public? Would the people you lead say you treated them with dignity?

Ethical leadership isn't just morally right - it builds the trust that makes everything else possible.`,
        keyTakeaways: [
          'Power creates temptations that require conscious resistance',
          'Ethical leadership builds lasting trust and loyalty',
          'The best test: would you be proud if everyone knew?'
        ],
        examples: [
          'Why companies with ethical cultures outperform long-term',
          'How leaders lose trust through small ethical compromises',
          'The difference between a boss people fear vs. respect'
        ],
        estimatedMinutes: 8
      }
    ]
  },
  'stability-equation': {
    id: '4',
    name: 'The Stability Equation',
    slug: 'stability-equation',
    description: 'Deep dive into S = R(L+G) / (|L-G| + C) and how societies stay stable.',
    icon: 'zap',
    color: '#10b981',
    lessons: [
      {
        id: 'se-1',
        title: 'What Is Stability?',
        content: `Stability doesn't mean things never change. It means a system can absorb shocks and continue functioning.

Think of it like balance. A stable person can handle bad news without falling apart. A stable relationship can survive disagreements. A stable society can weather crises.

**Stability has two sides:**
1. **Resilience** - Bouncing back from problems
2. **Adaptability** - Changing when necessary

Too rigid, and you break. Too flexible, and you lose identity. The sweet spot is structured flexibility - core principles that don't change, with methods that adapt.

The Akorfa Stability Equation helps measure and understand what makes systems stable or unstable.`,
        keyTakeaways: [
          'Stability = resilience + adaptability',
          'Neither rigidity nor chaos creates stability',
          'Stable systems have firm principles with flexible methods'
        ],
        examples: [
          'Why some people handle stress better than others',
          'How democracies stay stable through peaceful transfers of power',
          'Why some companies survive disruption while others fail'
        ],
        estimatedMinutes: 7
      },
      {
        id: 'se-2',
        title: 'The Formula Explained',
        content: `The Stability Equation: **S = R(L+G) / (|L-G| + C)**

Let's break down each part:

**S = Stability** - What we're measuring. Higher is more stable.

**R = Resilience factor** - The system's ability to recover from shocks. Built through resources, relationships, and adaptability.

**L = Local OS strength** - How well the immediate community/team/family functions. Local connections and local governance.

**G = Global OS alignment** - How well connected to and aligned with larger systems (nation, market, global community).

**|L-G| = Mismatch** - The absolute difference between local and global. When local values clash with global systems, instability rises.

**C = Conflict intensity** - Active opposition, violence, or breakdown in communication.

**The insight:** Stability comes from strong local AND global alignment, high resilience, and low conflict.`,
        keyTakeaways: [
          'Stability requires both local strength and global alignment',
          'Mismatch between local and global creates instability',
          'Resilience acts as a multiplier for stability'
        ],
        examples: [
          'Brexit: High L-G mismatch created instability',
          'Why some neighborhoods thrive (strong L, aligned with G)',
          'How social movements create temporary instability to create new stability'
        ],
        estimatedMinutes: 10
      },
      {
        id: 'se-3',
        title: 'Building Resilience (R)',
        content: `Resilience is your buffer against chaos. It's what keeps you standing when life pushes back.

**Individual resilience comes from:**
- Physical health and energy
- Emotional regulation skills
- Strong relationships and support network
- Financial buffer and resources
- Sense of purpose and meaning

**System resilience comes from:**
- Diverse connections (not dependent on single points)
- Redundancy (backup options)
- Fast feedback loops (detecting problems early)
- Stored resources (savings, reserves, inventory)
- Shared identity and trust

**Key insight:** Resilience is built in good times for use in bad times. The time to build your buffer is before you need it.`,
        keyTakeaways: [
          'Resilience is built proactively, not reactively',
          'Diversity and redundancy increase system resilience',
          'Individual and collective resilience reinforce each other'
        ],
        examples: [
          'Why emergency funds matter (personal resilience)',
          'How Taiwan built chip manufacturing resilience',
          'Why communities with strong social ties recover faster from disasters'
        ],
        estimatedMinutes: 9
      },
      {
        id: 'se-4',
        title: 'Balancing Local and Global',
        content: `The L-G mismatch is where most instability comes from. When local values clash with global systems, tension rises.

**Signs of high L-G mismatch:**
- "We don't belong here"
- "They don't understand us"
- "The system is rigged against us"
- Local traditions vs. global standards conflicts

**Reducing mismatch requires:**
1. **Translation** - Helping each side understand the other's perspective
2. **Adaptation** - Global systems accommodating local variation
3. **Integration** - Finding shared values that bridge the gap
4. **Representation** - Local voices in global decisions

The goal isn't uniformity - it's coherence. Different parts working together despite differences.`,
        keyTakeaways: [
          'L-G mismatch is a primary source of instability',
          'Neither forced uniformity nor pure localism works',
          'Bridging requires translation, adaptation, and representation'
        ],
        examples: [
          'Why globalization creates backlash in some communities',
          'How successful multinationals adapt to local cultures',
          'Why federal systems allow local variation within shared frameworks'
        ],
        estimatedMinutes: 9
      },
      {
        id: 'se-5',
        title: 'Managing Conflict (C)',
        content: `Conflict isn't always bad - it can surface important issues. But unmanaged conflict destabilizes everything.

**Conflict escalation stages:**
1. **Disagreement** - Different views, still communicating
2. **Competition** - Trying to win, still playing by rules
3. **Hostility** - Seeing the other as enemy, breaking rules
4. **Violence** - Physical or total destruction as goal

**De-escalation requires:**
- Early intervention (easier at stage 1-2)
- Creating space for communication
- Finding shared interests behind positions
- Face-saving exits for all parties
- Addressing root causes, not just symptoms

**Key insight:** The goal isn't zero conflict - it's keeping conflict constructive and below the threshold of destruction.`,
        keyTakeaways: [
          'Conflict escalates in predictable stages',
          'Early intervention is much easier than late-stage resolution',
          'Constructive conflict can strengthen systems'
        ],
        examples: [
          'How labor unions and companies find productive tension',
          'Why some divorces are amicable and others destructive',
          'How restorative justice reduces recidivism'
        ],
        estimatedMinutes: 10
      }
    ]
  }
};

const ICON_MAP: { [key: string]: React.ReactNode } = {
  brain: <Brain className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  crown: <Crown className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />
};

export default function TrackDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMode, setAiMode] = useState<'deepen' | 'question'>('deepen');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const track = TRACKS_DATA[slug];

  useEffect(() => {
    let uid = localStorage.getItem('demo_user_id');
    if (!uid) {
      uid = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('demo_user_id', uid);
    }
    setUserId(uid);
    const saved = localStorage.getItem(`completed_lessons_${slug}`);
    if (saved) {
      setCompletedLessons(new Set(JSON.parse(saved)));
    }
  }, [slug]);

  if (!track) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Track not found</h1>
        <Link href="/insight-school" className="text-indigo-600 hover:underline">
          Back to Insight School
        </Link>
      </div>
    );
  }

  const currentLesson = track.lessons[currentLessonIndex];
  const progress = Math.round((completedLessons.size / track.lessons.length) * 100);

  const markComplete = () => {
    const newCompleted = new Set(completedLessons);
    newCompleted.add(currentLesson.id);
    setCompletedLessons(newCompleted);
    localStorage.setItem(`completed_lessons_${slug}`, JSON.stringify([...newCompleted]));
    
    if (currentLessonIndex < track.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const askAI = async (mode: 'deepen' | 'question', customQuestion?: string) => {
    if (!userId) {
      setAiResponse('Please wait while we set up your session...');
      return;
    }

    setAiLoading(true);
    setAiResponse('');
    setShowAIPanel(true);
    setAiMode(mode);

    try {
      const message = mode === 'deepen' 
        ? `I'm learning about "${currentLesson.title}" in the ${track.name} track. Please explain this concept in simpler, everyday terms with relatable examples that anyone can understand:\n\n${currentLesson.content.substring(0, 800)}`
        : `I'm studying "${currentLesson.title}" in the ${track.name} track. My question is: ${customQuestion || aiQuestion}`;

      const res = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message,
          topic: track.name,
          layer: 'conscious'
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setAiResponse(`I couldn't process that request: ${data.error}. Please try again.`);
      } else {
        setAiResponse(data.response || 'No response received.');
        if (data.session?.id) {
          setSessionId(data.session.id);
        }
      }
    } catch (err) {
      setAiResponse('Sorry, I couldn\'t connect to the AI. Please check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuestion.trim()) {
      askAI('question', aiQuestion);
      setAiQuestion('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link 
        href="/insight-school" 
        className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Insight School
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${track.color}20` }}>
          <div style={{ color: track.color }}>
            {ICON_MAP[track.icon]}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{track.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{track.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress: {completedLessons.size} of {track.lessons.length} lessons</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: track.color }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Lessons</h3>
            <div className="space-y-2">
              {track.lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLessonIndex(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    index === currentLessonIndex 
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {completedLessons.has(lesson.id) ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : index === currentLessonIndex ? (
                    <Play className="w-4 h-4 flex-shrink-0" style={{ color: track.color }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600 flex-shrink-0" />
                  )}
                  <span className="truncate">{lesson.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentLesson.title}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{currentLesson.estimatedMinutes} min</span>
            </div>

            <div className="prose prose-indigo dark:prose-invert max-w-none mb-6">
              {currentLesson.content.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {paragraph.split('**').map((part, j) => 
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </p>
              ))}
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Key Takeaways</h4>
              <ul className="space-y-2">
                {currentLesson.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-indigo-800 dark:text-indigo-200">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Real-World Examples</h4>
              <ul className="space-y-2">
                {currentLesson.examples.map((example, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => askAI('deepen')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Deepen with AI
              </button>

              <button
                onClick={() => { setShowAIPanel(true); setAiMode('question'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Ask a Question
              </button>

              {!completedLessons.has(currentLesson.id) && (
                <button
                  onClick={markComplete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                disabled={currentLessonIndex === 0}
                className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentLessonIndex(Math.min(track.lessons.length - 1, currentLessonIndex + 1))}
                disabled={currentLessonIndex === track.lessons.length - 1}
                className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showAIPanel && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  {aiMode === 'deepen' ? 'AI Explanation' : 'Ask Your Question'}
                </h3>
                <button 
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiMode === 'question' && !aiResponse && (
                <form onSubmit={handleQuestionSubmit} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="What would you like to understand better?"
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!aiQuestion.trim() || aiLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Thinking...</span>
                </div>
              ) : aiResponse ? (
                <div className="prose prose-indigo dark:prose-invert max-w-none">
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiResponse}</div>
                  <button
                    onClick={() => { setAiResponse(''); setAiMode('question'); }}
                    className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                  >
                    Ask another question
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
