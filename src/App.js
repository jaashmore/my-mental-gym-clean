import React, { useState, useEffect, useMemo } from 'react';
import Logo from "./Logo";
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, BookOpen, Shield, Home, Lock, Zap, ChevronDown, CheckCircle, Circle, Bell, X, LogOut, MessageCircle } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import ChatBot from "./ChatBot";
import SpeechBubbleIcon from "./SpeechBubbleIcon";
import AdminPanel from "./AdminPanel";

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RpsvRGCzl4sutfYlZ8ibkfpuZp6JFqrwMBFhPFvqgpW6AdYcIfaDbvq1U14AP1bdlMuqb4eH15jdmMTPX4MoEs900G1JeVb1q'; // Real Stripe publishable key
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);


// Coach API base URL — local server for now
const COACH_API =
  process.env.REACT_APP_COACH_API || "http://localhost:8787";

/** Send a user message to your Coach backend and return the AI's reply */
const askCoach = async (question, userId = "anon") => {
  const res = await fetch(`${COACH_API}/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, userId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Coach server error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.answer || "").trim();
};



// Logo is now imported from './Logo.js' and uses logo.svg


// --- COURSE DATA ---
// This is the entire 24-week course structured as a JavaScript object.
const courseData = {

    1: {
        title: "The Mind as the Starting Block",
        weeklyIntro: "Welcome to Week 1. Before we can learn to direct our thoughts, we must first learn to simply observe them without judgment. Many athletes are controlled by their thoughts—a flash of doubt before a big play, a surge of anger after a mistake. They believe they are their thoughts. The goal this week is to break that illusion. This week's drills are designed to build the foundational skill of awareness. By practicing stillness and non-reaction, you will start to create a small space between a thought and your response to it. This space is where all mental power resides. It's the difference between an impulsive, emotional reaction and a calm, calculated action. This is the most fundamental skill in all of mental training.",
        days: [
            { title: "Day 1: The Stillness Drill", instructions: "For 5 minutes, sit upright and remain physically still. Your only job is to notice thoughts without reacting. When your mind wanders, gently guide it back to stillness.", deeperDive: "This drill trains your prefrontal cortex to resist impulsive reactions, a key skill for staying calm under pressure. You're creating a 'mental pause button' that prevents you from being rattled by a bad call or a mistake, allowing you to respond with logic instead of impulse.", journalPrompt: "Describe the 'chatter' in your mind. What kinds of thoughts kept popping up?" },
            { title: "Day 2: Noticing the Chatter", instructions: "Repeat the 5-minute stillness drill. Today, pay special attention to the types of thoughts that appear. Are they about the past? The future? Your to-do list? Just notice, don't judge.", deeperDive: "By identifying your mental habits, you begin to see that they are just thoughts, not commands. This separation is the first step to taking control and breaking free from negative thought loops that can sabotage performance.", journalPrompt: "What types of thoughts did you notice today? Were they mostly about the past, present, or future?" },
            { title: "Day 3: Resisting Physical Impulses", instructions: "Repeat the 5-minute stillness drill. Today, your focus is on physical sensations. Notice the urge to scratch an itch, shift your weight, or fidget. Acknowledge the urge, but consciously choose not to act on it.", deeperDive: "Mental discipline and physical discipline are linked. Resisting small physical impulses strengthens your overall willpower, making it easier to push through fatigue or discomfort in a game.", journalPrompt: "What was the strongest physical urge you resisted during the drill? How did it feel to not act on it?" },
            { title: "Day 4: Extending the Time", instructions: "Today, we increase the challenge. Perform the stillness drill for 7 minutes. The goal is to maintain your composure and non-reaction as the duration increases.", deeperDive: "Just like lifting heavier weights, extending the time builds mental endurance. It trains your mind to stay focused and calm for longer periods, which is crucial for late-game situations.", journalPrompt: "How did the longer duration feel? Was there a point where it became more difficult?" },
            { title: "Day 5: Connecting to Your Sport", instructions: "Before your 7-minute drill, briefly visualize a recent, frustrating moment from a game or practice. Then, during the drill, if frustrating thoughts arise, practice letting them go just like any other thought.", deeperDive: "This exercise connects the abstract skill of stillness to real-world athletic scenarios. You are training your brain to detach from the emotion of a mistake and return to a neutral, focused state.", journalPrompt: "Did the memory of the frustrating moment affect your drill? Were you able to let it go?" },
            { title: "Day 6: The 10-Minute Challenge", instructions: "Today's drill is 10 minutes of complete stillness. Embrace the challenge. Notice how your mind and body feel as you push past your previous limits.", deeperDive: "Pushing your mental limits in a controlled setting builds profound confidence. When you know you can stay calm and focused for 10 minutes, a 30-second timeout feels like an eternity of calm.", journalPrompt: "What was the most challenging part of the 10-minute drill? How did you overcome it?" },
            { title: "Day 7: Weekly Reflection", instructions: "Perform the stillness drill for a final 10 minutes. Afterward, use the journal to reflect on the entire week's progress.", deeperDive: "Reflection solidifies learning. By looking back on the week's challenges and successes, you cement the new neural pathways you've started to build and prepare for the next stage of your training.", journalPrompt: "What was the biggest lesson you learned about your own mind this week?" },
        ]
    },
    2: { 
        title: "Control the Mental Locker Room", 
        weeklyIntro: "Last week, you learned to observe your thoughts. This week, you become the gatekeeper of your mind. Your inner voice can be your greatest coach or your harshest critic. For many athletes, the inner critic runs the show, replaying mistakes and fueling doubt. This week is about firing that critic and hiring a coach. We will use a powerful technique to actively intervene in your thought patterns. This isn't about pretending negative thoughts don't exist; it's about acknowledging them and consciously choosing a more powerful, productive response. You are learning to control the narrative in your head, which directly influences your confidence and actions on the field.",
        days: [
            { title: "Day 1: Identifying the Negative Voice", instructions: "Throughout the day, act as a detective for your own thoughts. When you make a mistake or feel frustrated, what is the first thing you say to yourself? Write down at least one negative self-talk phrase you notice.", deeperDive: "Awareness is the first step to change. You cannot fix a habit you don't know you have. Today is about gathering intelligence on your inner critic so you can understand its tactics and triggers.", journalPrompt: "What was the most common negative thought you caught yourself saying today?" },
            { title: "Day 2: The 'STOP' Command", instructions: "Today, when you catch a negative thought, mentally (or even out loud, if you're alone) shout 'STOP!'. Visualize a big red stop sign. The goal is simply to interrupt the pattern.", deeperDive: "This interruption breaks the automatic loop of a negative thought. It's a conscious intervention that prevents the thought from spiraling and affecting your emotional state. You are asserting control and showing your brain that this thought pattern is no longer acceptable.", journalPrompt: "Describe the feeling of interrupting a negative thought. Did it feel empowering?" },
            { title: "Day 3: Crafting Your Replacement", instructions: "Take the negative phrases you identified on Day 1. For each one, write a powerful, positive, and believable replacement. Instead of 'Don't mess up,' write 'I am focused and prepared.'", deeperDive: "Your replacement statements must be believable to you. If they are too generic or unbelievable, your mind will reject them. They should be grounded in the effort you put in, such as 'I trust my training' or 'I've made this shot a thousand times.'", journalPrompt: "What is one of your new, powerful replacement statements? Why is it believable to you?" },
            { title: "Day 4: Full Integration: Stop & Replace", instructions: "Now, combine the steps. When you catch a negative thought, shout 'STOP!' and immediately follow it with one of your powerful replacement statements. Do this every single time you notice the inner critic.", deeperDive: "This is where neuroplasticity happens. You are actively weakening the old, negative neural pathway and building a new, positive one. It feels like work at first, but with each repetition, the new pathway becomes stronger and more automatic.", journalPrompt: "Did you use the Stop & Replace technique today? Describe the situation and the outcome." },
            { title: "Day 5: Applying it to Physical Drills", instructions: "During your physical practice today, make a conscious effort to use the Stop & Replace technique. If you miss a shot or make a mistake in a drill, immediately interrupt any negative self-talk.", deeperDive: "The moments immediately following a mistake are the most critical for mental control. By using this technique during practice, you are training yourself to have a resilient response when it matters most in a game. You're building a habit of bouncing back instantly.", journalPrompt: "How did using this technique during physical practice affect your next attempt?" },
            { title: "Day 6: Replacing 'Don't' with 'Do'", instructions: "Focus on your language today. Notice how often you tell yourself 'Don't miss' or 'Don't mess up.' Replace these with 'Do' statements: 'Make this shot,' 'Focus on the target,' 'Execute with precision.'", deeperDive: "Your brain doesn't process negatives well. If you say 'Don't think about a pink elephant,' you immediately think of one. By focusing on what you want to do, you give your brain a clear, positive command to follow, which is far more effective than telling it what to avoid.", journalPrompt: "What was one 'Don't' statement you changed to a 'Do' statement today?" },
            { title: "Day 7: Weekly Reflection", instructions: "Review your journal entries for the week. How has becoming aware of your self-talk changed your mood or performance in training?", deeperDive: "Recognizing the shift in your internal dialogue is powerful. It proves that you have the ability to change your mindset. This reflection reinforces the effectiveness of the technique and builds your confidence to continue using it as a core mental skill.", journalPrompt: "What was the biggest change you noticed in your mindset this week?" }
        ]
    },
    3: { 
        title: "The Power of Unwavering Focus", 
        weeklyIntro: "Now that you can observe your thoughts and manage your inner dialogue, it's time to build your focus. Focus is a muscle; the more you train it, the stronger it gets. Most unforced errors in sports don't come from a lack of skill, but from a momentary lapse in concentration. This week, you'll learn to direct your attention like a laser beam. The goal is to develop 'attentional control,' the ability to choose what you pay attention to and ignore everything else. This means filtering out the crowd, the scoreboard, and your own internal distractions to lock in on the task at hand. Mastering this skill is the key to unlocking the state of 'flow,' where you perform at your best, almost automatically.",
        days: [
            { title: "Day 1: Object Lock-In", instructions: "For 5 minutes, focus on a small object (laces on a ball, a crack in the wall). Study every detail. When your mind wanders, gently bring it back.", deeperDive: "This is a pure concentration drill. By forcing your mind to stay on one neutral target, you are strengthening its ability to hold attention, just like bicep curls strengthen your arm.", journalPrompt: "What was the biggest distraction for you during the focus drill today (internal or external)?" },
            { title: "Day 2: Auditory Focus", instructions: "For 5 minutes, close your eyes and focus only on a single, continuous sound (a fan, the hum of a refrigerator). Tune out all other noises.", deeperDive: "Great athletes can hear their coach's voice through a screaming stadium. This drill trains your auditory filtering, allowing you to pick out the important sounds and ignore the distracting noise.", journalPrompt: "What did you notice when you tried to focus only on sound? Was it easier or harder than visual focus?" },
            { title: "Day 3: Expanding Awareness", instructions: "Sit quietly for 5 minutes. First, focus on your breath. Then, expand your awareness to the sounds in the room. Then, expand it further to the feeling of the chair beneath you. Practice shifting your focus without losing it.", deeperDive: "This teaches attentional flexibility. In a game, you need to shift from a narrow focus (the ball) to a broad focus (the whole field) and back again. This drill trains that mental agility.", journalPrompt: "Describe the experience of shifting your focus. Did you feel in control of where your attention went?" },
            { title: "Day 4: Focus Under Duress", instructions: "Perform the Object Lock-In drill for 7 minutes, but this time, have music or a TV on in the background. Your task is to hold your focus on the object despite the distraction.", deeperDive: "This simulates in-game distractions. It's easy to focus in a quiet room; it's hard with a crowd yelling. This drill builds your mental 'shield' against external noise.", journalPrompt: "How did the background noise affect your ability to focus? Did you get better at ignoring it?" },
            { title: "Day 5: Sport-Specific Cues", instructions: "Identify one key visual cue in your sport (the spin of the ball, the position of a defender's hips). For 5 minutes, visualize that cue in your mind's eye with intense clarity.", deeperDive: "You are training your brain to instantly recognize the most important information for your sport. This speeds up your decision-making, making you react faster and more effectively.", journalPrompt: "What is the most important visual cue for your position in your sport? Why?" },
            { title: "Day 6: The 'Reset' Word", instructions: "Choose a simple, powerful word like 'Focus,' 'Now,' or 'Here.' During practice, if you feel your mind drifting, mentally say your reset word to bring your attention back to the present moment.", deeperDive: "This is a quick-action tool to stop a mental spiral. A mistake can cause your focus to drift to the past ('I can't believe I did that'). Your reset word is an anchor that pulls your attention back to the only time that matters: right now.", journalPrompt: "Did you use your reset word in practice? Describe the situation." },
            { title: "Day 7: Weekly Reflection", instructions: "Reflect on your ability to focus this week. In what situations is it easiest to focus? When is it hardest?", deeperDive: "Understanding your personal focus patterns is key. Knowing your triggers for distraction allows you to be proactive in using your mental tools before your focus slips.", journalPrompt: "What is your biggest takeaway from this week of focus training?" }
        ]
    },
    4: { 
        title: "Building Your Mental Blueprint", 
        weeklyIntro: "Your brain and nervous system cannot tell the difference between a vividly imagined experience and a real one. This is a scientific fact, and it's the secret weapon of elite athletes. When you mentally rehearse a perfect performance, you are creating and strengthening the neural pathways required to execute that skill in reality. This week, we move from simple focus to active creation. You will become the architect of your own success by building a detailed mental blueprint of a perfect performance. We'll start from a third-person perspective, like a coach or scout, which allows you to analyze your form and strategy objectively.",
        days: [
            { title: "Day 1: The Perfect Simple Skill", instructions: "Choose one fundamental skill (a free throw, a golf putt, a serve). For 5 minutes, watch yourself execute it perfectly on a mental movie screen.", deeperDive: "This initial step creates the basic 'file' in your brain for success. You are establishing a clear image of what perfect execution looks like, which your mind will use as a reference.", journalPrompt: "Describe your 'Perfect Play' in detail. What did perfect execution look like from the outside?" },
            { title: "Day 2: Adding Detail", instructions: "Repeat Day 1's drill, but add more detail. See the perfect arc of the ball, the smooth follow-through of your arm, the ideal body positioning.", deeperDive: "The more detail you add, the more 'real' the visualization becomes to your brain. You are adding layers of data to the neural blueprint, making it more robust and easier for your body to follow.", journalPrompt: "What is one small detail of your technique you noticed and corrected while visualizing today?" },
            { title: "Day 3: Visualizing the 'Why'", instructions: "As you visualize your perfect skill, also visualize why it was perfect. See the perfect backspin on the ball causing it to swish through the net. See the perfect footwork that gave you the power.", deeperDive: "This connects the action to the result. It deepens your understanding of the skill's mechanics, moving beyond just 'what it looks like' to 'how it works.' This is crucial for self-correction in a game.", journalPrompt: "Why was the play you visualized successful? What were the key mechanical components?" },
            { title: "Day 4: The Full Sequence", instructions: "Now, visualize the entire sequence. See yourself getting ready for the free throw, taking a deep breath, executing it perfectly, and seeing the positive result.", deeperDive: "Sports skills don't happen in a vacuum. By visualizing the pre-shot routine and the successful aftermath, you are building a complete performance sequence, which helps automate the entire process under pressure.", journalPrompt: "Describe your pre-shot routine in your visualization. Was it calm and consistent?" },
            { title: "Day 5: Visualizing a Teammate", instructions: "To strengthen your objective view, visualize a teammate or a professional athlete you admire executing the skill perfectly. What can you learn from watching them?", deeperDive: "This helps you identify key technical elements you might be missing in your own performance. It's a form of mental modeling that can accelerate your learning curve.", journalPrompt: "What did you learn from visualizing someone else perform the skill?" },
            { title: "Day 6: Visualizing a Complex Play", instructions: "Move beyond a single skill. Visualize your team executing a complex play perfectly, and see your specific role within it. See yourself making the right pass, the right cut, or the right block.", deeperDive: "This expands your visualization from individual skill to team strategy. It helps you understand your role in the bigger picture and improves your in-game decision-making and timing.", journalPrompt: "What was your role in the complex play you visualized? How did you contribute to the team's success?" },
            { title: "Day 7: Weekly Reflection", instructions: "How has visualizing success changed your confidence when you physically practice the skill?", deeperDive: "This reflection helps you connect the mental work to the physical results. Recognizing the increase in confidence reinforces the value of visualization and motivates you to continue the practice.", journalPrompt: "Do you feel more prepared to execute this skill in a game now? Why?" }
        ]
    },
    5: { 
        title: "HD Visualization: Making It Real", 
        weeklyIntro: "Last week, you were the director, watching the movie of your success. This week, you become the star. A blurry, detached mental image has little power. A rich, multi-sensory, first-person visualization is what truly convinces your subconscious mind that the event is real and achievable. We will upgrade your mental blueprint to High Definition by engaging all your senses. The more senses you involve, the deeper the blueprint is etched into your mind. We will also add the most important ingredient: emotion. Feeling the success is the key to unlocking it.",
        days: [
            { title: "Day 1: First-Person View", instructions: "Take your 'Perfect Play' from last week and switch the camera. Experience it through your own eyes. What do you see right before, during, and after the play?", deeperDive: "Visualizing from a first-person perspective activates the motor cortex in your brain more strongly than a third-person view. You are telling your brain, 'This is what I am doing,' not just 'This is what is being done.'", journalPrompt: "What did you see from your own eyes during the visualization?" },
            { title: "Day 2: Adding Touch and Feel", instructions: "Repeat the first-person visualization, but now focus on the sense of touch. Feel the grip of the bat, the texture of the ball, the ground under your feet.", deeperDive: "The sense of touch (kinesthetics) is powerful for athletes. By mentally rehearsing the physical feeling of a perfect motion, you are fine-tuning your muscle memory without ever moving.", journalPrompt: "Describe the physical sensations you focused on. Did it make the visualization feel more real?" },
            { title: "Day 3: Adding Sound", instructions: "Now, add the auditory layer. What are the specific sounds of your success? The crack of the bat, the swish of the net, the roar of the crowd, the sound of your own breathing.", deeperDive: "Sound is a powerful environmental cue. By including the sounds of the game in your visualization, you make the mental rehearsal more realistic and train yourself to stay focused amidst the noise of actual competition.", journalPrompt: "What sounds did you add to your mental movie? Did they increase the intensity?" },
            { title: "Day 4: The Power of Emotion", instructions: "This is the most important step. As you complete your perfect visualization, attach the powerful emotion of success. Feel the surge of pride, the joy, the relief, the confidence. Let the feeling wash over you.", deeperDive: "Emotion acts like a super glue for memory. A visualization charged with positive emotion is far more likely to be recalled and replicated under pressure than a neutral, technical one.", journalPrompt: "Describe the specific emotion you attached to your successful visualization. Was it pride, relief, excitement?" },
            { title: "Day 5: Visualizing Adversity", instructions: "Visualize a moment of adversity (being tired, a bad call). Now, use first-person, multi-sensory visualization to see, hear, and feel yourself overcoming it with calm confidence.", deeperDive: "You are not just rehearsing success; you are rehearsing resilience. This prepares you for the inevitable challenges of a game, giving you a pre-programmed confident response to adversity.", journalPrompt: "How did you feel after visualizing yourself overcoming adversity?" },
            { title: "Day 6: The Full HD Rehearsal", instructions: "Combine it all. For 10 minutes, run through your perfect play in first-person, engaging sight, sound, touch, and powerful, positive emotion.", deeperDive: "This is the full dress rehearsal for your brain. By repeatedly running this HD simulation, you are making the feeling of success your default expectation.", journalPrompt: "How did the full HD rehearsal feel compared to the simpler visualizations from earlier in the week?" },
            { title: "Day 7: Weekly Reflection", instructions: "Which part of this drill (senses or emotion) had the biggest impact on you and why?", deeperDive: "Understanding which sensory inputs are most powerful for you allows you to customize your visualizations for maximum impact in the future.", journalPrompt: "Which sense will you focus on improving in your visualizations next week?" }
        ]
    },
    6: {
        title: "Defining Your Victory",
        weeklyIntro: "A vague wish like 'I want to be a better player' gives your brain no direction. It's like telling a GPS 'I want to go somewhere nice.' A clear, definite, present-tense goal ('I am the team's most reliable defender') gives your brain a specific destination to navigate towards. This week, you will learn to program your brain's internal 'GPS' with a powerful statement of purpose. By stating your goal in the present tense, you bypass the doubt of the conscious mind and speak directly to your creative subconscious, which works tirelessly to turn that statement into your physical reality.",
        days: [
            { title: "Day 1: Crafting Your Goal", instructions: "Write down one specific, major goal for your season. Phrase it as if it's already true: 'I am...' or 'I have...' Make it bold but believable.", deeperDive: "Writing a goal in the present tense tricks your subconscious mind into accepting it as a current reality, which then begins to organize your thoughts and actions to match that reality.", journalPrompt: "Write down your Present Tense Goal. Does it feel ambitious? Is it specific enough?" },
            { title: "Day 2: The Morning & Night Ritual", instructions: "Read your Present Tense Goal with feeling and conviction every morning upon waking and every night before sleeping. As you read, take a moment to imagine how it feels to have already achieved it.", deeperDive: "The mind is most receptive to suggestion just after waking and just before sleeping. This ritual impresses your goal onto your subconscious at the most opportune times.", journalPrompt: "Did you feel any resistance or doubt when you first started saying your goal? Describe that feeling." },
            { title: "Day 3: Finding the Feeling", instructions: "Today, as you read your goal, focus entirely on generating the feeling of its accomplishment. Does it feel like pride? Relief? Excitement? Hold that feeling for 60 seconds.", deeperDive: "Your subconscious mind responds to feeling, not just words. By associating a powerful, positive emotion with your goal, you give it the fuel it needs to manifest.", journalPrompt: "What is one small action you can take today that is in alignment with your Present Tense Goal?" },
            { title: "Day 4: Connecting Goal to Action", instructions: "Identify one small action you can take today that is in alignment with your goal. Before you do it, read your goal statement. After you do it, read it again, knowing you just moved one step closer.", deeperDive: "This creates a feedback loop of success. The goal inspires the action, and the action reinforces the belief in the goal.", journalPrompt: "How does repeating this goal change the way you approach your daily practice?" },
            { title: "Day 5: Overcoming Doubt", instructions: "If you feel doubt when reading your goal, don't fight it. Acknowledge it, and then say to yourself, 'Nevertheless, I am [Your Goal].' This acknowledges the doubt without giving it power.", deeperDive: "Fighting a thought gives it energy. By acknowledging it and calmly reaffirming your goal, you are training your mind to treat doubt as irrelevant noise.", journalPrompt: "What is your micro-goal for this week?" },
            { title: "Day 6: Creating a Micro-Goal", instructions: "Break down your main goal into a smaller, one-week goal. Write it in the present tense (e.g., 'I am the hardest worker in practice this week.'). Focus on this micro-goal for the day.", deeperDive: "Micro-goals make the larger vision less intimidating and provide more frequent opportunities for a sense of accomplishment, which builds momentum.", journalPrompt: "As you repeat your goal, is the feeling of it being real getting stronger? Describe the change." },
            { title: "Day 7: Weekly Reflection", instructions: "Has focusing on a definite outcome made your efforts feel more purposeful? How has your belief in the goal changed over the week?", deeperDive: "This review helps you see the tangible results of your mental work, solidifying the connection between your inner world of thought and your outer world of action.", journalPrompt: "Has focusing on a definite outcome made your efforts feel more purposeful?" }
        ]
    },
    7: {
        title: "Building Unshakable Belief",
        weeklyIntro: "Belief isn't just a thought; it's a feeling of absolute certainty that you hold in your body. Doubt is the enemy of peak performance. The fastest way to build belief in a future goal is to borrow the feeling from a past success. Your mind and body already know what success feels like. This week, we will connect the dots. You will learn to harness the powerful, positive emotions from your past victories and anchor them to the new goals you are creating. This process builds a bridge in your mind from 'I did it before' to 'I can do it again.'",
        days: [
            { title: "Day 1: The Highlight Reel", instructions: "Close your eyes and mentally replay 2-3 of your proudest moments in your sport. Don't just see them; re-live them. Focus on the feeling of confidence and achievement it gave you.", deeperDive: "You are accessing your personal library of success. Your brain stores these memories and their associated feelings. This drill is like pulling the 'confidence' file.", journalPrompt: "Describe the past successes on your 'Highlight Reel.' What is the common feeling that links them all together?" },
            { title: "Day 2: Naming the Feeling", instructions: "Repeat the Highlight Reel drill. Today, give that core feeling of success a name. Is it 'Unstoppable,' 'Calm Confidence,' or 'Focused Power'?", deeperDive: "Giving the feeling a name makes it a tangible mental tool that you can recall more easily and intentionally.", journalPrompt: "What did you name your feeling of success?" },
            { title: "Day 3: Anchoring", instructions: "Now, as you re-live a highlight and feel that success, create a simple physical anchor, like touching your thumb and index finger together. Do this several times. This links the physical action to the mental state.", deeperDive: "This is a technique from Neuro-Linguistic Programming (NLP). You are creating a classical conditioning link, where a neutral stimulus (the touch) becomes associated with a powerful emotional state.", journalPrompt: "Describe the physical anchor you chose. Did you feel the emotional state when you fired it?" },
            { title: "Day 4: Firing the Anchor", instructions: "Throughout the day, especially before practice, fire your anchor (touch your thumb and index finger) and consciously recall the feeling of success. The goal is to be able to trigger that state on demand.", deeperDive: "Repetition strengthens the neural connection. The more you practice firing the anchor, the faster and more powerfully you'll be able to call up the feeling of confidence when you need it.", journalPrompt: "Did you use your anchor before or during practice today? What was the effect?" },
            { title: "Day 5: Connecting to Your Goal", instructions: "Now, combine the steps. Fire your anchor to bring up the feeling of success, and then immediately read your Present Tense Goal from last week. Do this multiple times.", deeperDive: "You are now transferring the feeling of certainty from a past, proven success onto your future, desired success. This makes the new goal feel much more attainable to your subconscious mind.", journalPrompt: "Did connecting your anchor to your goal make the goal feel more real?" },
            { title: "Day 6: Acting 'As If'", instructions: "In today's practice, consciously carry yourself 'as if' you have already achieved your goal. How would you walk? How would you talk to teammates? How would you approach a difficult drill?", deeperDive: "Your physiology and psychology are a two-way street. Acting confident can actually make you feel more confident. This 'fake it 'til you make it' approach helps align your body with the belief you are building.", journalPrompt: "How did 'acting as if' change your approach to practice today?" },
            { title: "Day 7: Weekly Reflection", instructions: "How has this process of anchoring past success to your future goal affected your overall confidence?", deeperDive: "By reflecting on this, you acknowledge the power you have to change your own state. This builds meta-confidence—confidence in your ability to become confident.", journalPrompt: "Do you feel a stronger sense of certainty about your goal now than you did seven days ago?" }
        ]
    },
    8: {
        title: "Game Day Integration",
        weeklyIntro: "All the training from the past seven weeks culminates in this final step: creating a simple, powerful, and repeatable pre-performance routine. This is not a superstition; it is a strategic mental warm-up. It is your personal trigger to shift from your everyday mindset into your 'performance state' on command. A solid routine eliminates pre-game anxiety and mental clutter. It allows you to step onto the field or court with a mind that is calm, focused, and confident. By making your mental preparation automatic, you free up all your mental energy for what truly matters: competing at your absolute best.",
        days: [
            { title: "Day 1: Designing Your Routine", instructions: "Write down your 3-step Performance Prime Routine. Make it short (3-5 minutes) and simple. Example: 1. Three deep breaths. 2. One minute of HD visualization of a key skill. 3. Recite your Present Tense Goal with feeling.", deeperDive: "The key to a good routine is that it is simple, repeatable, and under your control. It shouldn't depend on any external factors. This gives you a sense of certainty in the chaos of competition.", journalPrompt: "Write down your 3-step Performance Prime Routine. Is it simple and easy to remember?" },
            { title: "Day 2: The First Practice", instructions: "Perform your new routine before today's practice begins. Notice how you feel stepping onto the field compared to usual.", deeperDive: "This is the first live test. The goal is to make the routine a habit, so it feels as natural as tying your shoes.", journalPrompt: "Perform your routine before your next practice. Describe how you felt mentally (focus, confidence, nerves) as you started." },
            { title: "Day 3: Finding Your Time and Place", instructions: "When is the best time to do this routine? In the locker room? On the bus? On the sideline? Experiment and find the time and place that works best for you.", deeperDive: "By establishing a consistent time and place, you strengthen the routine's power as a psychological trigger. Your brain learns that 'when I'm in this spot, doing this thing, it's time to perform.'", journalPrompt: "When is the best time to do this routine? In the locker room? On the sideline? Find your spot." },
            { title: "Day 4: The 'Reset' Routine", instructions: "Create a mini, 10-second version of your routine. It could be one deep breath and a single reset word. Practice using this in practice immediately after a mistake to instantly get back on track.", deeperDive: "You won't always have 5 minutes for your full routine. A 'reset' routine is a powerful tool for in-game composure, allowing you to quickly move on from errors and refocus.", journalPrompt: "How can you use a mini-version of this routine (e.g., just one deep breath and your affirmation) to reset after a mistake in a game?" },
            { title: "Day 5: Refining the Routine", instructions: "Adjust one part of your routine. Try a different affirmation or visualize a different skill. Does it feel more powerful? The goal is to perfect it for you.", deeperDive: "Your routine should evolve with you. As you grow as an athlete, you might find that different elements work better. This process of refinement keeps your mental game sharp.", journalPrompt: "Adjust one part of your routine. For example, try a different affirmation or visualization. What felt better?" },
            { title: "Day 6: Full Dress Rehearsal", instructions: "Perform your routine today with the same intensity and focus as you would on game day. Treat it as the most important part of your preparation.", deeperDive: "This builds the habit under simulated pressure. The more you can make your practice environment feel like a game environment, the better your skills will transfer.", journalPrompt: "Did you feel more in control of your mental state after doing the routine?" },
            { title: "Day 7: Weekly Reflection", instructions: "How will you ensure you make this routine a non-negotiable part of your athletic life?", deeperDive: "Commitment is the final step. By making a conscious decision to integrate this into your identity as an athlete, you ensure you will continue to reap the benefits long after this course is over.", journalPrompt: "Reflect on the week. How will you ensure you make this routine a permanent part of your athletic life?" }
        ]
    },
    9: {
        title: "Performing Under Pressure",
        weeklyIntro: "You've built the foundational tools. Now, it's time to test them under fire. Pressure is a privilege—it means you're in a situation that matters. Many athletes crumble under pressure because their mental state is dictated by the external situation. This week, you will learn to dictate your mental state to the situation. The goal is to intentionally introduce mental 'stressors' in the safe environment of your mind. By practicing your skills in simulated high-stakes scenarios, you train your nervous system to remain calm and focused when the real pressure hits. You are building an immunity to the panic and anxiety that cause others to choke.",
        days: [
            { title: "Day 1: The Pressure Inoculation", instructions: "For 5 minutes, visualize a high-pressure situation in your sport (bottom of the ninth, game-winning free throw). Just observe the scene and the feelings that arise without trying to change them.", deeperDive: "This is a form of stress inoculation training. By repeatedly exposing yourself to a simulated stressor in a controlled way, you gradually decrease your physiological and psychological response to it. Your brain learns that this situation, while intense, is not a true threat, which prevents the 'fight or flight' response from taking over and hijacking your performance.", journalPrompt: "Describe the physical and mental feelings that arose when you visualized the pressure situation." },
            { title: "Day 2: Anchoring in the Storm", instructions: "Repeat Day 1's visualization. This time, when you feel the simulated pressure, consciously use your physical anchor (from Week 7) to trigger the feeling of calm confidence.", deeperDive: "You are now actively conditioning a new response. Instead of pressure automatically triggering anxiety, you are training your nervous system to associate pressure with the feeling of confidence you've already cultivated. This gives you a tool to change your state in the middle of a high-stakes moment.", journalPrompt: "Did using your anchor in the simulated pressure situation help you feel more in control?" },
            { title: "Day 3: The 'Reset' Word Under Fire", instructions: "In your visualization of the high-pressure moment, imagine a small mistake happening. Immediately use your 'Reset' word (from Week 3) to bring your focus back to the next play, not the error.", deeperDive: "Pressure amplifies the impact of mistakes. This drill is crucial because it trains you to break the chain reaction where one mistake leads to another. You are building a mental circuit breaker that stops the negative momentum before it can start, which is a hallmark of mentally tough athletes.", journalPrompt: "How did it feel to use your 'Reset' word immediately after a visualized mistake?" },
            { title: "Day 4: Sensory Gating", instructions: "Visualize the most distracting environment possible—a loud, hostile crowd. Practice using your focus drills to 'gate' out the noise, narrowing your attention to only the essential cues of the game.", deeperDive: "This is an advanced focus drill. You are training your brain to actively filter sensory input. By mentally practicing this, you make it easier to find a 'bubble' of concentration during real games, where the noise of the crowd fades into the background and your focus on the game becomes crystal clear.", journalPrompt: "Were you able to successfully 'gate' out the distracting noise in your visualization?" },
            { title: "Day 5: Slowing Down Time", instructions: "In a high-pressure visualization, mentally slow the moment down. See the play unfold in slow motion, giving yourself more mental time to make the perfect decision.", deeperDive: "When you're under pressure, your perception of time can speed up, leading to rushed, poor decisions. This drill trains your brain to stay calm and process information deliberately. Elite athletes often report that in crucial moments, the game seems to 'slow down' for them; this is a skill you are actively cultivating.", journalPrompt: "Did the game 'slow down' for you during your visualization? Describe the feeling." },
            { title: "Day 6: The 'What's Important Now?' (WIN) Drill", instructions: "When visualizing pressure, ask yourself 'What's Important Now?'. The answer is never the mistake you just made or the fear of the outcome; it's always the immediate next step. Practice this mental question-and-answer.", deeperDive: "This simple question is a powerful tool for present-moment focus. It cuts through anxiety about the past or future and brings your attention back to the only thing you can control: your next action. It is a practical mantra used by countless high-performers to stay grounded.", journalPrompt: "What was your answer to 'What's Important Now?' during your visualization drill?" },
            { title: "Day 7: Weekly Reflection", instructions: "Review your journal entries. How did your body and mind react to the simulated pressure? Did the tools you've learned help you feel more in control?", deeperDive: "This reflection helps you recognize your growth. Acknowledging that you can now mentally handle situations that used to seem overwhelming builds a deep and lasting form of confidence in your mental preparation.", journalPrompt: "What is your biggest takeaway about how you currently handle pressure?" }
        ]
    },
    10: {
        title: "The Resilient Athlete",
        weeklyIntro: "Every athlete, even the greatest, makes mistakes and faces setbacks. The difference is that elite athletes bounce back faster. Resilience isn't about never failing; it's about not letting one failure lead to another. It's about treating failure as feedback, not a final verdict. This week, we will train your 'bounce-back' ability. You will learn to reframe mistakes, extract the lesson, and immediately refocus on the next task. This process turns a potential confidence-breaker into a valuable learning opportunity, making you mentally tougher and more adaptable with every error.",
        days: [
            { title: "Day 1: The Mistake Reframe", instructions: "Visualize a recent mistake you made. Instead of dwelling on the negative feeling, ask yourself: 'What is the one lesson I can learn from this?'", deeperDive: "This shifts your brain from an emotional, self-critical state to an analytical, problem-solving one. By searching for a lesson, you turn a negative event into a productive one, which prevents your confidence from taking a hit.", journalPrompt: "What was the lesson you extracted from the mistake you visualized?" },
            { title: "Day 2: The 'Mental Flush'", instructions: "After visualizing a mistake, perform a symbolic action to 'flush' it. It could be wiping your hand on your uniform or tapping your helmet. Then, immediately visualize the next play being successful.", deeperDive: "This combines a physical action with a mental one to create a powerful reset ritual. The physical act signals to your brain that the moment is over, while the subsequent successful visualization replaces the blueprint of failure with one of success.", journalPrompt: "Describe your 'mental flush' ritual. Did it help you move on from the mistake?" },
            { title: "Day 3: The 10-Second Rule", instructions: "In practice today, give yourself exactly 10 seconds to be frustrated after a mistake. After that, your focus must shift entirely to the next play. This contains the negative emotion and prevents it from spiraling.", deeperDive: "This drill teaches emotional discipline. It's okay to feel frustration, but you can't let it linger. By putting a time limit on it, you acknowledge the feeling without letting it take over your performance.", journalPrompt: "How did the 10-second rule work in practice? Was it hard to let go of the frustration?" },
            { title: "Day 4: Success Rehearsal", instructions: "Instead of dwelling on a mistake, spend 5 minutes visualizing yourself executing that same skill perfectly three times in a row.", deeperDive: "This actively overwrites the neural pathway of the mistake. Your brain remembers the most recent and most repeated patterns. By rehearsing success immediately after a failure, you ensure the successful blueprint is stronger.", journalPrompt: "Did rehearsing success after a mistake help change your feeling about that mistake?" },
            { title: "Day 5: The 'Good-Better-How' Review", instructions: "After practice, instead of just thinking about what went wrong, review your performance with this framework: What did I do good? How could I do it better? How will I practice that improvement tomorrow?", deeperDive: "This structured reflection forces a balanced and constructive review of your performance. It prevents you from only focusing on the negatives and creates a clear, actionable plan for improvement, which builds confidence.", journalPrompt: "What was one 'Good-Better-How' insight you had after a recent practice?" },
            { title: "Day 6: Visualizing the Comeback", instructions: "Visualize your team being down late in a game. See yourself making a key play that sparks a comeback. Feel the shift in momentum and the belief that comes with it.", deeperDive: "This builds your belief in your ability to perform when it matters most. You are mentally rehearsing being the kind of player who steps up in tough situations, making it more likely you'll do so in reality.", journalPrompt: "Describe the feeling of sparking a comeback in your visualization." },
            { title: "Day 7: Weekly Reflection", instructions: "How has your perspective on making mistakes changed this week? Do you feel you can bounce back faster?", deeperDive: "This reflection solidifies the new, resilient mindset. By noticing your own growth in how you handle failure, you reinforce the idea that you are a mentally tough athlete who learns and adapts rather than one who is defined by errors.", journalPrompt: "Do you feel more confident in your ability to bounce back from errors? Why or why not?" }
        ]
    },
    11: {
        title: "Advanced Visualization: Opponent Modeling",
        weeklyIntro: "Basic visualization is about perfecting your own actions. Advanced visualization is about anticipating and overcoming the actions of others. This week, you will learn to mentally scout your opponents, creating a significant strategic advantage. By visualizing your opponent's tendencies, strengths, and weaknesses, you can mentally rehearse your counters. This prepares your mind and body to recognize patterns and react instantly in a game, making you feel like you're one step ahead of the competition.",
        days: [
            { title: "Day 1: Scouting Report", instructions: "Think of a specific opponent. For 5 minutes, visualize them. What are their go-to moves? What are their strengths? Just observe.", deeperDive: "This is mental film study. You are building a detailed file in your brain about your opponent, which will help you recognize their patterns more quickly during a game.", journalPrompt: "What are the top 2-3 tendencies you noticed about your visualized opponent?" },
            { title: "Day 2: Finding the Weakness", instructions: "Repeat the visualization. This time, look for a weakness or a predictable tendency in your opponent's game.", deeperDive: "Every opponent has patterns. By actively looking for them in your mind, you train your brain to spot them in real-time, giving you a strategic edge.", journalPrompt: "What is one potential weakness you identified in your opponent's game?" },
            { title: "Day 3: The Counter-Move", instructions: "Visualize your opponent using their signature move. Then, see yourself executing the perfect counter-move flawlessly.", deeperDive: "You are mentally rehearsing your response to their best weapon. This builds both the confidence and the muscle memory to execute that counter when the opportunity arises.", journalPrompt: "Describe the counter-move you visualized. Did it feel effective?" },
            { title: "Day 4: Rehearsing Different Scenarios", instructions: "Visualize yourself competing against this opponent in three different scenarios: when you're winning, when you're losing, and when it's a close game. See yourself succeeding in all three.", deeperDive: "This prepares you for the emotional swings of a game. It ensures that your confidence isn't dependent on the score, but on your ability to execute your game plan in any situation.", journalPrompt: "Which scenario (winning, losing, or close) was the most challenging to visualize success in? Why?" },
            { title: "Day 5: Anticipation Drill", instructions: "In your mind, see the play before it happens. Based on your opponent's setup, anticipate their next move and visualize yourself already in position to stop it.", deeperDive: "This trains your sports IQ. Elite athletes seem to know what's going to happen next. This isn't magic; it's the result of intense pattern recognition, a skill you are honing with this drill.", journalPrompt: "Did you feel like you were 'one step ahead' during the anticipation drill?" },
            { title: "Day 6: The 'If-Then' Plan", instructions: "Create a mental 'if-then' plan. 'If my opponent does X, then I will do Y.' Rehearse this mental script several times.", deeperDive: "This creates automatic responses to specific game situations. It reduces the need for in-the-moment decision making, allowing you to react faster and more decisively.", journalPrompt: "What is one 'If-Then' plan you created for a specific opponent?" },
            { title: "Day 7: Weekly Reflection", instructions: "Do you feel more prepared and less intimidated by the thought of facing a tough opponent after this week's drills?", deeperDive: "This reflection solidifies your sense of preparation. Confidence comes from knowing you've done the work, both physically and mentally, to be ready for any challenge.", journalPrompt: "How has this week's practice changed how you will prepare for your next opponent?" }
        ]
    },
    12: {
        title: "The Leader's Mindset",
        weeklyIntro: "Leadership isn't just for captains. Every athlete on a team can be a leader through their presence, their work ethic, and their communication. This week is about cultivating the mental habits of a leader. True leaders are a stabilizing force. They remain calm under pressure, they lift up their teammates, and they communicate with clarity and confidence. These are not just personality traits; they are skills that can be trained. This week, you will practice the mental drills that build a leadership presence.",
        days: [
            { title: "Day 1: Confident Body Language", instructions: "For 5 minutes, visualize yourself on the field with perfect posture: head up, shoulders back, a look of calm focus. Feel the confidence this projects.", deeperDive: "Your body language not only affects how others see you, but it also sends signals back to your own brain. Standing tall can actually make you feel more confident. This is a simple way to influence both your own mindset and your team's.", journalPrompt: "How did it feel to consciously hold confident body language? Did you notice a change in your mindset?" },
            { title: "Day 2: The Encouragement Rehearsal", instructions: "Visualize a teammate making a mistake. See yourself going over to them, offering a word of encouragement, and helping them refocus.", deeperDive: "A leader's job is to make those around them better. By mentally rehearsing positive interactions, you make it more likely you'll do it automatically in a game, which builds team chemistry and resilience.", journalPrompt: "Describe the encouraging words you visualized saying to a teammate." },
            { title: "Day 3: The Composure Drill", instructions: "Visualize a bad call from a referee. Instead of reacting with anger, see yourself taking a deep breath, turning your focus back to your team, and communicating the next play calmly.", deeperDive: "Your team takes its emotional cues from its leaders. If you stay calm, they are more likely to stay calm. This drill trains you to be the thermostat, not the thermometer, setting the emotional tone for your team.", journalPrompt: "How did it feel to remain calm in the face of a bad call in your visualization?" },
            { title: "Day 4: Leading by Example", instructions: "In today's practice, make it your mission to be the first one in a drill and the one with the most energy. Pay attention to how this affects the teammates around you.", deeperDive: "Actions are the most powerful form of leadership. Your effort is contagious. By consciously deciding to lead with your work ethic, you raise the standard for the entire team.", journalPrompt: "Did you notice a change in your team's energy when you led by example in practice?" },
            { title: "Day 5: The 'We' Statement", instructions: "In your self-talk, consciously replace 'I' with 'We.' Instead of 'I need to score,' think 'We need a good possession.' This shifts your focus to the team's success.", deeperDive: "This simple language shift fosters a team-first mentality. It reduces individual pressure and reinforces the idea that success is a collective effort.", journalPrompt: "What was one 'I' statement you successfully changed to a 'We' statement?" },
            { title: "Day 6: The Huddle Visualization", instructions: "Visualize yourself in a crucial team huddle. See yourself speaking with clarity and confidence, giving your teammates the belief that you will succeed.", deeperDive: "This prepares you for key leadership moments. By rehearsing what you would say and how you would say it, you ensure that when the moment comes, you can communicate effectively and inspirationally.", journalPrompt: "What was the key message you delivered in your visualized team huddle?" },
            { title: "Day 7: Weekly Reflection", instructions: "What is one way you can be a better leader for your team, regardless of your official role?", deeperDive: "Leadership is a continuous process of growth. This reflection helps you identify specific, actionable steps you can take to improve your leadership skills.", journalPrompt: "What is one specific leadership action you will take this week?" }
        ]
    },
    13: {
        title: "The Confidence Bank",
        weeklyIntro: "Confidence is not a mystical quality you're born with; it's a result. It is the direct result of compiling evidence of your competence. Doubts arise when you focus on the few times you've failed. Unshakable confidence comes from consistently remembering the many times you've succeeded. This week, you will become the accountant for your own 'Confidence Bank.' You will learn to actively seek, acknowledge, and record evidence of your success, no matter how small. Each entry is a deposit that you can draw upon when you face a moment of doubt.",
        days: [
            { title: "Day 1: The Daily Deposit", instructions: "At the end of the day, write down at least one thing you did well in practice or a drill. It can be anything from a perfect pass to simply giving maximum effort.", deeperDive: "This drill trains your brain to look for successes. Over time, this counteracts the natural human tendency to focus on negatives (the 'negativity bias').", journalPrompt: "What was your 'daily deposit' of success from today's practice?" },
            { title: "Day 2: The 'Highlight' Deposit", instructions: "Re-watch a video of one of your good plays, or simply visualize it in detail. Make a 'deposit' into your bank by acknowledging the skill and effort it took.", deeperDive: "By reliving past successes, you re-activate the neural pathways and feelings of competence, reinforcing your belief in your abilities.", journalPrompt: "Describe the highlight you re-lived today. What made it a successful play?" },
            { title: "Day 3: The 'Effort' Deposit", instructions: "Today, focus on your effort. Even if the results weren't perfect, acknowledge and make a mental deposit for your hard work and perseverance.", deeperDive: "Confidence isn't just about results; it's about trusting your work ethic. Recognizing your effort builds a type of confidence that isn't dependent on a good or bad day.", journalPrompt: "What was one instance of great effort you deposited into your bank this week?" },
            { title: "Day 4: The 'Learning' Deposit", instructions: "When you learn a new skill or correct a mistake, that's a deposit. Acknowledge that you are getting better and more knowledgeable.", deeperDive: "This frames mistakes and learning as a positive. Every time you improve, you are adding to your arsenal of skills, which is a powerful source of confidence.", journalPrompt: "What is one new skill or correction you've learned recently that you can 'deposit'?" },
            { title: "Day 5: The Withdrawal", instructions: "Before a challenging drill, consciously 'withdraw' a memory from your confidence bank. Remember a time you succeeded in a similar situation and carry that feeling with you.", deeperDive: "This is a practical application of your confidence bank. You are using your stored evidence of success to fuel your performance in the present moment.", journalPrompt: "Describe a time you made a 'withdrawal' from your confidence bank. Did it help?" },
            { title: "Day 6: The Compliment Deposit", instructions: "When a coach or teammate gives you a compliment, don't brush it off. Accept it as valid evidence of your competence and make a deposit.", deeperDive: "Many athletes deflect praise. By consciously accepting it, you are allowing external validation to reinforce your internal belief.", journalPrompt: "Did you receive a compliment this week? What was it and did you 'deposit' it?" },
            { title: "Day 7: Weekly Reflection", instructions: "Review your 'deposits' from the week. How does it feel to see a written record of your successes and efforts?", deeperDive: "This review process makes your competence tangible. It's hard to feel unconfident when you have a long list of evidence proving you are capable and hardworking.", journalPrompt: "Read through all your deposits for the week. What does this evidence tell you about yourself as an athlete?" }
        ]
    },
    14: {
        title: "Automating Your Skills",
        weeklyIntro: "You have now practiced many different mental skills. The goal of a true master is to make these skills so ingrained that they become automatic. You don't consciously think about how to dribble a basketball; you just do it. The same should be true for your mental skills. This week is about reducing the conscious effort required to use your mental tools. We will work on integrating them into your physical practice so that they become a natural, second-nature response to the challenges of your sport.",
        days: [
            { title: "Day 1: The Triggered Routine", instructions: "Link your Performance Prime Routine to a specific, consistent trigger. For example, the moment you start lacing up your cleats, your routine begins automatically.", deeperDive: "This creates a powerful habit loop. The trigger (lacing cleats) initiates the routine, which delivers the reward (a focused mental state). Over time, this becomes completely automatic.", journalPrompt: "What is the specific trigger you chose for your pre-performance routine?" },
            { title: "Day 2: The Mid-Drill Reset", instructions: "During a physically demanding practice drill, intentionally use your 'Reset' word and one deep breath between repetitions to practice refocusing while fatigued.", deeperDive: "This trains you to use your mental skills under physical stress, which is crucial for game performance. It ensures your mental game doesn't break down when your body gets tired.", journalPrompt: "Describe a moment in practice where you used your mid-drill reset. Was it effective?" },
            { title: "Day 3: Visualizing the Automation", instructions: "Spend 5 minutes visualizing yourself automatically using a mental skill. For example, see yourself making a mistake and instantly 'flushing' it without having to think about it.", deeperDive: "By visualizing the automatic use of a skill, you are programming your subconscious mind to execute it without conscious effort. You are building the 'muscle memory' for your mental game.", journalPrompt: "How did it feel to visualize your mental skills happening automatically, without effort?" },
            { title: "Day 4: The 'One-Word' Focus", instructions: "Choose one word that represents your goal for today's practice (e.g., 'Explosive,' 'Precise,' 'Calm'). Use this word as your only mental focus during the drills.", deeperDive: "This simplifies your mental process. Instead of juggling multiple thoughts, you have one clear directive. This is an effective way to enter a flow state during practice.", journalPrompt: "What was your 'one-word' focus for today's practice? Did it help simplify your mindset?" },
            { title: "Day 5: Linking Self-Talk to Action", instructions: "As you perform a physical action (like shooting or swinging), pair it with a positive affirmation. For example, as you release a shot, think 'Perfect form.'", deeperDive: "This links your positive mindset directly to your physical execution, creating a powerful synergy where your thoughts and actions are perfectly aligned.", journalPrompt: "What positive self-talk did you link to a physical action today?" },
            { title: "Day 6: The 'No-Thought' Drill", instructions: "For a short period in practice, try to perform with an empty mind, trusting your training completely. The goal is to let your automated skills take over without conscious interference.", deeperDive: "This is the ultimate goal of automation: 'unconscious competence.' It's a state where you perform at your best without thinking, relying on the thousands of physical and mental reps you've put in.", journalPrompt: "Describe your experience with the 'no-thought' drill. Was it difficult to let go and trust your training?" },
            { title: "Day 7: Weekly Reflection", instructions: "Which mental skill feels the most automatic to you right now? Which one still requires the most conscious effort?", deeperDive: "This self-assessment helps you identify where you need to continue focusing your mental training efforts to achieve full automation across all your skills.", journalPrompt: "Which mental skill is closest to being fully automatic for you?" }
        ]
    },
    15: {
        title: "The Off-Season Mind",
        weeklyIntro: "The off-season is where champions are made. While many athletes rest their minds, elite performers use this time to build a mental foundation that will carry them through the next season. Mental training doesn't stop when the games do. This week is about applying your mental skills to your off-season training. You will learn to set productive goals, stay motivated when no one is watching, and use visualization to enhance your physical gains. This is how you ensure you start the next season not just physically stronger, but mentally tougher.",
        days: [
            { title: "Day 1: Defining the Off-Season Goal", instructions: "Set one clear, specific goal for your off-season. It could be physical (gain 5 pounds of muscle) or skill-based (improve my non-dominant hand).", deeperDive: "A clear goal gives your off-season purpose. It turns unstructured time into a productive training block and provides a clear metric for success.", journalPrompt: "What is your single most important goal for this off-season?" },
            { title: "Day 2: The Training Visualization", instructions: "Before a workout, spend 5 minutes visualizing yourself performing the exercises with perfect form and high intensity. See the workout as a success before you even start.", deeperDive: "This mental rehearsal improves the quality of your physical training. It primes your muscles for the workout and reinforces the correct movement patterns, leading to better results.", journalPrompt: "How did visualizing your workout before you started affect the quality of your training?" },
            { title: "Day 3: The 'Boring' Drill Focus", instructions: "The off-season has a lot of repetitive, boring drills. Use your focus exercises (like Object Lock-In) to stay engaged and get the most out of every single repetition.", deeperDive: "Champions are built on a foundation of mastering the boring fundamentals. This drill helps you find purpose and quality in the monotonous work that others skip.", journalPrompt: "Describe a 'boring' drill you did this week. How did you use your focus skills to make it productive?" },
            { title: "Day 4: The Motivation Anchor", instructions: "Reconnect with your 'Why' (from Week 16). When your motivation wanes during a tough off-season workout, recall your deepest reason for playing your sport.", deeperDive: "The off-season is a long grind. Your 'Why' is the deep, intrinsic motivation that will keep you going when the short-term rewards of game day are absent.", journalPrompt: "What is your 'Why'? Did you use it to push through a tough moment this week?" },
            { title: "Day 5: Visualizing Next Season's Success", instructions: "Spend 10 minutes visualizing yourself at the start of next season, feeling the benefits of your off-season work. See yourself as faster, stronger, and more confident.", deeperDive: "This connects your current hard work to your future success. It provides a powerful incentive to stay disciplined by giving you a clear picture of the reward that awaits you.", journalPrompt: "Describe the successful athlete you visualized yourself being at the start of next season." },
            { title: "Day 6: The Skill-Acquisition Rehearsal", instructions: "If you're learning a new skill, mentally rehearse the movements perfectly each night before you sleep. This speeds up the learning process.", deeperDive: "Your brain consolidates learning during sleep. By mentally rehearsing before bed, you are giving your brain a clear blueprint to work with, accelerating the rate at which a new skill becomes automatic.", journalPrompt: "What new skill are you working on? Did you mentally rehearse it before sleeping?" },
            { title: "Day 7: Weekly Reflection", instructions: "How can you use these mental tools to make your off-season training more productive and purposeful?", deeperDive: "This reflection turns your off-season from a passive period into an active, strategic part of your development as a complete athlete.", journalPrompt: "What is your plan to continue your mental training throughout the entire off-season?" }
        ]
    },
    16: {
        title: "The 'Why' Revisited",
        weeklyIntro: "Over a long season or career, it's easy to get caught up in the stats, the wins, and the losses, and forget why you started playing in the first place. Your deepest motivation—your 'Why'—is the ultimate fuel source that can get you through any setback, any grueling practice, or any slump. This week, we will reconnect with that core passion. By clarifying your purpose, you create a source of motivation that is far more powerful than any external reward. When you know your 'Why,' the 'How' becomes easier.",
        days: [
            { title: "Day 1: The First Memory", instructions: "For 5 minutes, visualize your very first memory of loving your sport. What did it feel like? What did you enjoy about it?", deeperDive: "This reconnects you to the pure, simple joy of the game. This joy is a powerful source of intrinsic motivation that can be easily forgotten amidst the pressures of competition.", journalPrompt: "What is your earliest, happiest memory of your sport? Describe the feeling." },
            { title: "Day 2: The 'Three Whys'", instructions: "Ask yourself 'Why do I play this sport?'. Whatever your answer, ask 'Why is that important to me?'. Ask 'Why?' one more time to get to the core emotional reason.", deeperDive: "This technique cuts through surface-level answers to uncover your deepest values. Your true 'Why' is rarely about winning; it's about what winning represents to you (e.g., camaraderie, self-improvement, making your family proud).", journalPrompt: "After asking 'Why?' three times, what did you discover is your core reason for playing?" },
            { title: "Day 3: Writing Your Purpose Statement", instructions: "Based on your answers, write a short 'Purpose Statement.' Example: 'I play because I love to compete, push my limits, and be part of a team that strives for greatness.'", deeperDive: "A written purpose statement makes your motivation concrete. It's a powerful reminder you can look at any time you feel your motivation slipping.", journalPrompt: "Write down your new, clarified Purpose Statement." },
            { title: "Day 4: The Pre-Practice Reminder", instructions: "Read your Purpose Statement right before you start practice today. Notice how it changes your approach to the drills.", deeperDive: "This infuses your daily grind with a sense of higher purpose. It turns a boring drill from a chore into a step on the path to fulfilling your 'Why.'", journalPrompt: "How did reading your Purpose Statement before practice change your energy and focus?" },
            { title: "Day 5: The 'Tough Moment' Anchor", instructions: "Think of a tough moment you faced in your sport. How could remembering your 'Why' have helped you get through it with a better mindset?", deeperDive: "Your 'Why' is your ultimate source of resilience. When things get tough, remembering your purpose gives you the strength to persevere.", journalPrompt: "How can your 'Why' help you overcome the next major challenge you face?" },
            { title: "Day 6: Sharing Your Passion", instructions: "Explain to a friend or family member what you love most about your sport. Articulating it to someone else can clarify it for yourself.", deeperDive: "The act of teaching or explaining something forces you to understand it on a deeper level. It solidifies your own connection to your purpose.", journalPrompt: "What was it like to explain your passion for your sport to someone else?" },
            { title: "Day 7: Weekly Reflection", instructions: "How does focusing on your love for the game, rather than just the outcome, change your experience as an athlete?", deeperDive: "This reflection helps you cultivate a more sustainable and joyful relationship with your sport, which is the key to long-term success and avoiding burnout.", journalPrompt: "How can you bring more of your 'Why' into your daily experience as an athlete?" }
        ]
    },
    17: {
        title: "Advanced Anchoring",
        weeklyIntro: "You've learned to create a single anchor to trigger a state of confidence. Now, we'll expand your toolkit. Different moments in a game require different mental states. You don't need the same mindset for a calm, focused free throw as you do for a high-energy, explosive start. This week, you will learn to create and use multiple anchors, each linked to a specific, desired mental state. This gives you precise control over your psychology, allowing you to call up the exact feeling you need, exactly when you need it.",
        days: [
            { title: "Day 1: The 'Calm Focus' Anchor", instructions: "Visualize a moment of intense focus (like the Object Lock-In drill). As you feel that calm focus, create a new anchor (e.g., tapping two fingers together).", deeperDive: "This anchor is for moments that require precision and clarity, like a free throw, a golf putt, or a crucial serve. You are conditioning your nervous system to associate this specific touch with a state of quiet concentration, filtering out the noise and pressure.", journalPrompt: "Describe the physical anchor you chose for 'Calm Focus.'" },
            { title: "Day 2: The 'High Energy' Anchor", instructions: "Visualize a moment of explosive energy (a sprint, a powerful hit, a fast break). As you feel that energy, create a different anchor (e.g., lightly slapping your thigh).", deeperDive: "This anchor is your ignition switch. It's for moments when you need to instantly access your peak physical state, like the start of a race or coming off the bench. You're linking a physical cue to a state of explosive readiness.", journalPrompt: "Describe the physical anchor you chose for 'High Energy.'" },
            { title: "Day 3: The 'Resilience' Anchor", instructions: "Visualize bouncing back from a mistake. Feel the determination and forward-looking mindset. Create a third anchor for this feeling (e.g., clenching your fist).", deeperDive: "This is your mental reset button. Mistakes can trigger a downward spiral of negativity. This anchor interrupts that spiral, immediately bringing you back to a state of determined resilience, ready for the next play.", journalPrompt: "Describe the physical anchor you chose for 'Resilience.'" },
            { title: "Day 4: Differentiating the Anchors", instructions: "Practice firing each of your three anchors (Confidence, Calm Focus, High Energy) one after another. Notice how your mental and physical state shifts with each one.", deeperDive: "This drill sharpens your ability to consciously shift between mental states. It's like being a DJ of your own mind, able to choose the right 'track' for any given moment in the game.", journalPrompt: "Did you feel a distinct shift in your state as you fired each of your new anchors?" },
            { title: "Day 5: Situational Practice", instructions: "In today's practice, use your anchors in specific situations. Use the 'Calm Focus' anchor before a skill drill, the 'High Energy' anchor before a sprint, and the 'Resilience' anchor after a mistake.", deeperDive: "This is where you move from theory to application. By using your anchors in a live practice environment, you strengthen the connection and make them more reliable during actual competition.", journalPrompt: "Describe a specific situation in practice where you used one of your new anchors." },
            { title: "Day 6: Pre-Game Selection", instructions: "Before your next practice or game, decide which mental state you want to start with. Use that specific anchor as part of your pre-game routine.", deeperDive: "This adds another layer of intention to your preparation. You are not just warming up your body; you are deliberately choosing and setting your mental state for optimal performance from the very first whistle.", journalPrompt: "Which anchor do you think will be most valuable for you in a game situation?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: How did it feel to have a toolkit of different mental states to choose from? In which situation was an anchor most useful?", deeperDive: "This reflection helps you understand the power of state management. You are recognizing that your feelings are not random events, but controllable states that you can learn to call upon at will.", journalPrompt: "How does having multiple anchors make you feel more prepared for competition?" },
        ]
    },
    18: {
        title: "Team Visualization",
        weeklyIntro: "Your individual mental game is strong. Now it's time to extend that power to your team. When a team shares a common vision and trusts each other implicitly, they become far more than the sum of their parts. Collective confidence is a powerful competitive advantage. This week, you will practice visualizing not just your own success, but the success of your entire team. If you are in a leadership position, you can even guide your teammates through these exercises. This builds a shared mental blueprint for victory.",
        days: [
            { title: "Day 1: The Assist", instructions: "Visualize yourself making a perfect pass that leads to a teammate scoring. Feel the shared success.", deeperDive: "This drill shifts your focus from individual achievement to collective success. It strengthens your awareness of your teammates and reinforces the idea that your role is to make everyone around you better.", journalPrompt: "How did it feel to visualize yourself setting up a teammate for success?" },
            { title: "Day 2: The Defensive Stop", instructions: "Visualize your entire team working together seamlessly to get a crucial defensive stop. See the communication, the rotations, and the trust.", deeperDive: "Great defense is about trust and cohesion. By visualizing successful team defense, you are mentally rehearsing your role in the system and building confidence in your teammates' ability to do their jobs.", journalPrompt: "What were the key elements of the successful team defensive stop you visualized?" },
            { title: "Day 3: The Celebration", instructions: "Visualize your team celebrating together after a big win. Feel the unity and shared joy.", deeperDive: "Visualizing a shared celebration strengthens team bonds and creates a powerful, positive emotional goal that the entire team can work towards. It builds the 'we' mentality.", journalPrompt: "Describe the feeling of the team celebration you imagined." },
            { title: "Day 4: Visualizing a Teammate's Success", instructions: "Pick one teammate. Spend 5 minutes visualizing them having a great game and making a key play.", deeperDive: "This exercise builds empathy and reduces internal team rivalry. When you genuinely want your teammates to succeed, the entire team's performance is elevated.", journalPrompt: "Which teammate did you visualize succeeding, and what did you see them do?" },
            { title: "Day 5: The Communication Rehearsal", instructions: "Visualize a difficult moment in a game. See yourself communicating clearly and calmly with your teammates to solve the problem together.", deeperDive: "Effective communication breaks down under pressure. By mentally rehearsing clear, concise, and positive communication, you make it more likely you'll be a calming and constructive voice when your team needs it most.", journalPrompt: "What was the message you communicated to your team in your visualization of a difficult moment?" },
            { title: "Day 6: The Group Huddle (Optional)", instructions: "If you're comfortable, suggest a brief, 1-minute team visualization in a huddle before practice, focusing on a single goal for the day.", deeperDive: "This is a powerful leadership tool. Guiding your team through a shared vision aligns everyone's focus and energy, creating a unified purpose before you even start playing.", journalPrompt: "If you led a group huddle, how did your teammates respond?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: How does focusing on your team's success, in addition to your own, change your perspective as a player?", deeperDive: "This reflection helps you transition from an individual mindset to a leadership mindset. You begin to see the game through a wider lens, understanding that your greatest impact may come from elevating the play of others.", journalPrompt: "What is one way you can use visualization to be a better teammate this week?" }
        ]
    },
    19: {
        title: "Handling External Pressure",
        weeklyIntro: "As you progress in your sport, the external pressures will grow—from parents, coaches, scouts, and social media. These are outside your control. Trying to manage them is a waste of mental energy. The key is to build a mental shield. This week, you will learn to differentiate between what you can control (your effort, your focus, your attitude) and what you can't (everything else). By focusing all your energy on your 'circle of control,' you make yourself immune to the distractions and anxieties that come from the outside world.",
        days: [
            { title: "Day 1: The Circle of Control", instructions: "Draw two circles, one inside the other. In the inner circle, write down everything you can directly control in your sport. In the outer circle, write down everything you can't.", deeperDive: "This simple act makes a profound psychological distinction. It gives you clarity on where to invest your mental energy. Wasting energy on things you can't control is a recipe for anxiety and poor performance.", journalPrompt: "What are the top three things in your 'Circle of Control'? What are three things outside of it?" },
            { title: "Day 2: The 'Letting Go' Visualization", instructions: "Visualize a specific external pressure (e.g., a scout in the stands). Acknowledge it, then visualize putting it in a box, closing the lid, and placing it on a shelf. Return your focus to what you can control.", deeperDive: "This is a mental ritual for compartmentalization. You are not denying the pressure exists; you are consciously choosing not to let it affect you in the present moment, allowing you to focus on your performance.", journalPrompt: "What external pressure did you 'put in a box' today? Did it help you focus?" },
            { title: "Day 3: The 'So What?' Drill", instructions: "When a negative thought about an external pressure arises ('What if my parents are mad?'), answer it with 'So what? I will still focus on my effort.' This diminishes its power.", deeperDive: "This technique, borrowed from cognitive therapy, challenges the catastrophic thinking that pressure often creates. It helps you realize that the consequences of external judgment are rarely as significant as your mind makes them out to be.", journalPrompt: "Describe a situation where you used the 'So what?' technique to handle a worry." },
            { title: "Day 4: The 'My Game, My Rules' Affirmation", instructions: "Create an affirmation focused on your internal control, such as 'I play for myself. I control my effort and my focus.' Repeat this before practice.", deeperDive: "This affirmation reinforces your internal locus of control. It's a declaration that you are the one in charge of your experience, not the spectators or the critics.", journalPrompt: "What is your 'My Game, My Rules' affirmation?" },
            { title: "Day 5: The Social Media Fast", instructions: "For one day, avoid checking any social media related to your sport or team. Notice how this affects your mental state and focus.", deeperDive: "Social media is a major source of external pressure and comparison. This exercise demonstrates how much mental energy is consumed by these platforms and how much calmer and more focused you can be without them.", journalPrompt: "How did your one-day social media fast affect your mental state?" },
            { title: "Day 6: The Coach's Feedback Filter", instructions: "When a coach gives you critical feedback, practice filtering it. Let go of the emotion (the tone of voice) and focus only on the useful information you can control and apply.", deeperDive: "This allows you to be coachable without being emotionally fragile. It separates the instructional content of feedback from any emotional charge, enabling you to learn and improve without damaging your confidence.", journalPrompt: "What was a piece of coaching feedback you received, and how did you filter it for useful information?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: What external pressure affects you the most? How did this week's drills help you manage it?", deeperDive: "By identifying your specific pressure points, you can be more proactive in using these mental tools. This reflection is about creating a personalized strategy for handling the unique pressures you face.", journalPrompt: "What is your new strategy for dealing with the biggest external pressure you face?" }
        ]
    },
    20: {
        title: "The 'Inner Coach' Dialogue",
        weeklyIntro: "You've learned to stop negative self-talk and replace it. Now, we elevate that skill. Instead of just replacing a single thought, you will learn to have a full, constructive internal dialogue with your 'Inner Coach.' Your Inner Coach is the wise, calm, and strategic part of your mind. It's the voice that analyzes without judgment, offers solutions instead of criticism, and guides you through challenges. This week, you will practice activating this voice, turning your mind into your most trusted advisor during competition.",
        days: [
            { title: "Day 1: Meet Your Inner Coach", instructions: "Close your eyes. Imagine what your ideal coach would be like—calm, wise, supportive, strategic. This is the voice you will cultivate.", deeperDive: "Giving this positive, internal voice a personality makes it easier to access. You are creating a mental mentor that you can turn to at any time.", journalPrompt: "Describe the personality and voice of your Inner Coach." },
            { title: "Day 2: The Analytical Voice", instructions: "After a mistake in practice, instead of getting angry, ask your Inner Coach: 'What happened there, technically?' Analyze the error without emotion.", deeperDive: "This replaces self-criticism with objective analysis. It shifts your focus from the fact that you failed to the reason why, which is the only way to learn and improve.", journalPrompt: "What was one mistake you analyzed with your Inner Coach instead of your Inner Critic?" },
            { title: "Day 3: The Strategic Voice", instructions: "Before a difficult drill, ask your Inner Coach: 'What's the best strategy to succeed here?' Listen for the calm, logical answer.", deeperDive: "This promotes strategic thinking over brute force. You are practicing accessing the part of your brain that plans and problem-solves, rather than just reacting.", journalPrompt: "What was a strategic insight your Inner Coach provided before or during a drill?" },
            { title: "Day 4: The Motivational Voice", instructions: "When you feel tired, ask your Inner Coach: 'What do I need to hear right now to push through?' Provide yourself with that encouragement.", deeperDive: "This is a powerful form of self-regulation. You are learning to be your own source of motivation, which is far more reliable than depending on external sources.", journalPrompt: "What motivational phrase did your Inner Coach give you when you felt fatigued?" },
            { title: "Day 5: The 'In-Game' Conversation", instructions: "During practice, try to maintain a running internal dialogue with your Inner Coach, analyzing the play and planning your next move.", deeperDive: "This makes your mental skills active rather than passive. You are not just using them in breaks; you are integrating them into the flow of the game itself.", journalPrompt: "How did your 'in-game' conversation with your Inner Coach go? Was it easy to maintain?" },
            { title: "Day 6: The Post-Game Debrief", instructions: "After practice, have a 2-minute debrief with your Inner Coach. 'What went well? What needs work? What's the plan for tomorrow?'", deeperDive: "This structured self-reflection ensures that you learn something from every single practice, accelerating your development as an athlete.", journalPrompt: "What was the key takeaway from your post-practice debrief with your Inner Coach?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: How is the voice of your Inner Coach different from the voice of your Inner Critic?", deeperDive: "This reflection highlights the profound shift you are making. Recognizing the difference between these two voices solidifies your ability to choose the one that serves you.", journalPrompt: "How will you continue to strengthen the voice of your Inner Coach over your Inner Critic?" }
        ]
    },
    21: {
        title: "Long-Term Goal Setting",
        weeklyIntro: "You've practiced setting goals for your season. Now, we zoom out. True motivation comes from having a compelling vision for your future, both in and out of sports. This week, you will apply the goal-setting principles to your long-term athletic and life ambitions. By creating a clear vision for who you want to become in one, five, and ten years, you provide a powerful context for your daily efforts. It connects the grind of today's practice to the fulfillment of your ultimate dreams, creating a source of nearly limitless motivation.",
        days: [
            { title: "Day 1: The 1-Year Vision", instructions: "Journal for 10 minutes about the ideal version of yourself as an athlete and person one year from today. What have you accomplished? What skills have you mastered?", deeperDive: "This exercise gives your brain a clear target. A 1-year vision is close enough to be tangible but far enough to be inspiring.", journalPrompt: "Describe the athlete and person you envision yourself being one year from now." },
            { title: "Day 2: The 5-Year Vision", instructions: "Expand your vision. Where are you in five years? Are you playing in college? Have you mastered your position? What kind of person are you?", deeperDive: "This helps you think beyond the immediate and consider the kind of legacy you want to build as an athlete and person. It provides a larger 'why' for your efforts.", journalPrompt: "What is the most exciting part of your 5-year vision for yourself?" },
            { title: "Day 3: The 'Reverse Engineer' Plan", instructions: "Take your 1-year vision. What are the 3-4 major milestones you need to hit to get there? (e.g., make the varsity team, gain 10 pounds, improve your GPA).", deeperDive: "A vision without a plan is just a dream. This exercise breaks down your big goal into manageable steps, making it feel less overwhelming and more achievable.", journalPrompt: "What are the 3-4 key milestones for your 1-year vision?" },
            { title: "Day 4: The Process Goal", instructions: "For one of your milestones, define a 'process goal'—a daily or weekly action you can take. Example: 'To make varsity, my process goal is to do 100 extra reps every day.'", deeperDive: "You cannot directly control outcomes (like winning), but you can 100% control your process. Focusing on the process reduces pressure and, paradoxically, makes good outcomes more likely.", journalPrompt: "What is one process goal you can commit to this week to move toward a milestone?" },
            { title: "Day 5: Visualizing the Future Self", instructions: "Spend 5 minutes visualizing yourself as your 5-year-future self. Feel the confidence, the skill, and the accomplishment.", deeperDive: "This connects you emotionally to your long-term vision. By feeling the success now, you create a powerful magnetic pull that draws you towards your future self.", journalPrompt: "How did it feel to embody your 5-year future self during your visualization?" },
            { title: "Day 6: The 'Why' Connection", instructions: "Connect your long-term vision to your 'Why' from Week 16. How does becoming that future self fulfill your deepest purpose?", deeperDive: "This ensures your goals are aligned with your core values. Goals that are connected to your purpose are far more motivating than goals based on external validation.", journalPrompt: "How does your long-term vision connect to your core purpose, your 'Why'?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: How does having a long-term vision change your perspective on the challenges and hard work of today?", deeperDive: "This reflection helps you see that today's practice is not just another day, but a crucial building block for the future you are creating.", journalPrompt: "What is one thing you can do differently tomorrow, inspired by your long-term vision?" }
        ]
    },
    22: {
        title: "The Mind-Body Connection",
        weeklyIntro: "Your mind and body are not separate entities; they are a deeply interconnected system. Your mental state directly affects your physical recovery, your susceptibility to injury, and even how your body utilizes nutrients. This week, we focus on using your mental skills to enhance your physical well-being. You will learn to use visualization to speed up healing, manage pain, and improve the quality of your rest. This is about using your mind to build a stronger, more resilient body.",
        days: [
            { title: "Day 1: The Body Scan", instructions: "Lie down for 5 minutes. Mentally scan your body from your toes to your head. Notice any areas of tension, soreness, or tightness without judgment. Just be aware.", deeperDive: "This increases your proprioception—your sense of your body in space. It helps you identify minor issues before they become major injuries and improves your overall body awareness.", journalPrompt: "What did you notice during your body scan? Were there any areas of unexpected tension?" },
            { title: "Day 2: The 'Healing Light' Visualization", instructions: "If you have a sore muscle or minor injury, spend 5 minutes visualizing a warm, healing light surrounding that area, reducing inflammation and promoting recovery.", deeperDive: "While not a substitute for medical treatment, this technique can aid recovery. Visualization can influence blood flow and reduce the body's stress response, creating an optimal internal environment for healing.", journalPrompt: "Describe your 'healing light' visualization. Did you feel any change in the targeted area?" },
            { title: "Day 3: The 'Pain as Sensation' Drill", instructions: "If you feel pain during a tough workout, try to mentally re-label it. Instead of 'pain,' see it as 'intense sensation' or 'my muscles getting stronger.' This reframes your relationship to the discomfort.", deeperDive: "This is a cognitive reframing technique. The word 'pain' has a strong negative emotional charge. By changing the label, you can reduce the emotional response, which can actually decrease the perceived intensity of the sensation.", journalPrompt: "Did reframing 'pain' as 'sensation' change your experience of a difficult drill?" },
            { title: "Day 4: The 'Sleep Sanctuary' Visualization", instructions: "Before you go to sleep, visualize your mind and body entering a state of deep, restorative rest. See your muscles repairing and your energy being replenished.", deeperDive: "Quality sleep is the most powerful recovery tool. This visualization helps quiet a racing mind and signals to your body that it's time to shut down and repair, improving the quality of your rest.", journalPrompt: "How did the 'sleep sanctuary' visualization affect your rest last night?" },
            { title: "Day 5: Mindful Eating", instructions: "For one meal today, eat without distractions (no phone, no TV). Pay full attention to the taste, texture, and smell of your food. Notice how your body feels.", deeperDive: "This practice improves your awareness of your body's hunger and fullness cues. It can lead to better food choices and improved digestion, which are crucial for athletic performance.", journalPrompt: "What did you notice during your mindful eating meal?" },
            { title: "Day 6: The Pre-Workout Body Check-in", instructions: "Before practice, do a quick body scan. Ask your body what it needs today. Does it need more stretching? More warm-up time? Listen to the answer.", deeperDive: "This builds a partnership with your body. Instead of just forcing it to perform, you are listening to its needs, which leads to smarter training and a lower risk of injury.", journalPrompt: "What did your body 'tell' you during your pre-workout check-in?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: What did you learn about the connection between your thoughts and your physical feelings this week?", deeperDive: "This reflection solidifies the understanding that you are not just a body that has a mind, but a single, integrated system. Mastering this connection is a key to unlocking your full athletic potential.", journalPrompt: "What is the most important thing you learned about listening to your body this week?" }
        ]
    },
    23: {
        title: "The Gratitude Edge",
        weeklyIntro: "It's easy for competitive athletes to get caught in a cycle of constantly striving for more, never satisfied with their current performance. This can lead to burnout and anxiety. Gratitude is the powerful antidote. It shifts your focus from what you lack to what you have. This week, you will practice the skill of gratitude. By focusing on the opportunities, relationships, and abilities you are thankful for, you reduce performance anxiety and dramatically increase your enjoyment of the sport. A happy, grateful athlete is often a more relaxed and successful one.",
        days: [
            { title: "Day 1: The 'Three Good Things' Journal", instructions: "At the end of the day, write down three specific things that went well, no matter how small, and why they happened.", deeperDive: "This drill trains your brain to scan for positives instead of negatives. It's a simple but profound way to counteract the negativity bias and improve your overall mood and outlook.", journalPrompt: "What were the 'three good things' that happened today?" },
            { title: "Day 2: Gratitude for Your Body", instructions: "Spend 5 minutes thinking about all the amazing things your body allows you to do in your sport. Be grateful for its strength, speed, and skill.", deeperDive: "This fosters a positive relationship with your body. Instead of seeing it as a tool to be criticized, you begin to see it as a gift to be appreciated, which can reduce injury-related anxiety.", journalPrompt: "What specific ability of your body are you most grateful for as an athlete?" },
            { title: "Day 3: Gratitude for a Teammate", instructions: "Think of one teammate you are grateful for. Make a point to tell them something you appreciate about them today.", deeperDive: "Expressing gratitude strengthens social bonds and improves team chemistry. It creates a positive feedback loop where teammates feel valued and are more likely to support each other.", journalPrompt: "Which teammate did you express gratitude for, and how did they react?" },
            { title: "Day 4: Gratitude for a Challenge", instructions: "Think of a recent challenge or setback. What is one thing you can be grateful for about that experience? (e.g., 'I'm grateful for that loss because it showed us what we need to work on.').", deeperDive: "This is an advanced reframing technique. It finds the opportunity in adversity. This mindset turns every experience, even negative ones, into a source of growth.", journalPrompt: "What was the lesson or opportunity you found to be grateful for in a recent challenge?" },
            { title: "Day 5: Gratitude for the 'Little Things'", instructions: "Notice and feel gratitude for the simple things about your sport: the smell of the gym, the feel of a new ball, the sound of the whistle.", deeperDive: "This grounds you in the present moment and reconnects you with the simple joy of playing. It's a powerful antidote to the pressure of focusing only on outcomes.", journalPrompt: "What was one 'little thing' about your sport that you felt grateful for today?" },
            { title: "Day 6: The 'Gratitude Walk'", instructions: "Take a 10-minute walk and focus only on things you see that you are grateful for.", deeperDive: "This is a moving meditation that trains your mind to actively look for the good in your environment, a skill that can lift your spirits anytime, anywhere.", journalPrompt: "What did you notice on your gratitude walk that you usually overlook?" },
            { title: "Day 7: Weekly Reflection", instructions: "Journal: How did practicing gratitude this week affect your overall mood and your feelings about your sport?", deeperDive: "This reflection helps you see that performance and joy are not mutually exclusive. In fact, a grateful and joyful mindset often leads to the best performances.", journalPrompt: "How has practicing gratitude changed your overall mood this week?" }
        ]
    },
    24: {
        title: "The Complete Athlete",
        weeklyIntro: "Welcome to the final week of your foundational training. Over the past 23 weeks, you have systematically built a complete toolkit of mental skills. You have moved from a reactive athlete to a conscious creator of your own performance. This final week is about integration. It's about recognizing the transformation you've undergone and creating a personal plan to ensure these skills become a permanent part of who you are. You are no longer just an athlete who uses mental skills; you are a mentally tough athlete.",
        days: [
            { title: "Day 1: Reviewing Your Journey", instructions: "Read through your entire Master Journal. Notice the progress you've made from Week 1 to now. Acknowledge your commitment and growth.", deeperDive: "This review provides concrete evidence of your transformation. Seeing your journey in writing solidifies your new identity as a mentally skilled performer.", journalPrompt: "Looking back at your journal, what is the most significant change you've seen in your mindset since Week 1?" },
            { title: "Day 2: Identifying Your 'Go-To' Tools", instructions: "Of all the skills you've learned, which 2-3 have been the most powerful for you personally?", deeperDive: "This helps you create a personalized 'mental first-aid kit.' You are identifying your most effective tools so you can access them quickly when you need them most.", journalPrompt: "What are your top 2-3 'go-to' mental tools that you will carry with you?" },
            { title: "Day 3: Creating Your 'Mental Game Plan'", instructions: "Create a one-page 'Mental Game Plan.' Write down your purpose statement, your core affirmations, your pre-game routine, and your in-game reset strategies.", deeperDive: "This document is your personal blueprint for mental toughness. It's a concise summary of your most important mental tools that you can review before any competition.", journalPrompt: "Write down your one-page 'Mental Game Plan.'" },
            { title: "Day 4: Visualizing Your Future Self", instructions: "Spend 10 minutes visualizing yourself one year from now, having fully integrated all these skills. How do you handle pressure? How do you bounce back from mistakes? See the complete athlete you have become.", deeperDive: "This final visualization solidifies your new identity. You are not just hoping to be this person; you are mentally stepping into that role and making it your new reality.", journalPrompt: "Describe the future self you visualized. What is the most important quality they possess?" },
            { title: "Day 5: The 'Teach to Learn' Drill", instructions: "Explain one of the most important concepts you learned in this course to a friend or family member. Teaching something is the ultimate way to master it.", deeperDive: "When you teach something, you have to organize your thoughts and understand it on a deeper level. This process cements the knowledge in your own mind.", journalPrompt: "Who did you teach a concept to, and what did you learn from the experience?" },
            { title: "Day 6: Setting the Next Goal", instructions: "What's next on your journey of mental mastery? Set a new, small goal for the next month related to your mental game.", deeperDive: "Mental training is a lifelong practice. Setting a new goal ensures that you continue to build on the foundation you've created, rather than letting your skills atrophy.", journalPrompt: "What is your mental game goal for the next month?" },
            { title: "Day 7: Final Reflection", instructions: "Journal: What is the single biggest change you've seen in yourself over the past 24 weeks?", deeperDive: "This final reflection is a celebration of your hard work and transformation. Acknowledging your growth is a final, powerful deposit into your confidence bank.", journalPrompt: "What does it mean to you, now, to be a 'mentally tough' athlete?" }
        ]
    },
};

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAYQglzGXHF7kK-G1EDK3A-9POVfIS3F58",
  authDomain: "my-mental-gym.firebaseapp.com",
  projectId: "my-mental-gym",
  storageBucket: "my-mental-gym.appspot.com",
  messagingSenderId: "764179859851",
  appId: "1:764179859851:web:9fa3abe8b7dedfee21c78e"
};

const appId = 'mental-gym';



// --- Helper Functions ---
const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hoursInt = parseInt(hours);
    const ampm = hoursInt >= 12 ? 'PM' : 'AM';
    const hours12 = hoursInt % 12 || 12; // Convert hour to 12-hour format, 0 becomes 12
    return `${hours12}:${minutes} ${ampm}`;
};


// --- Main App Component ---
export default function App() {

  // --- State Management ---
  const [view, setView] = useState('loading'); 
  const [userData, setUserData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({ block2: false, block3: false, gamePlanUnlocked: false });
  const [journalEntries, setJournalEntries] = useState({});
  const [gamePlan, setGamePlan] = useState({ purpose: '', affirmations: '', routine: '', resets: '' });
  const [gamePlanDraft, setGamePlanDraft] = useState({ purpose: '', affirmations: '', routine: '', resets: '' });
  const gamePlanEditing = React.useRef(false); if (typeof window !== 'undefined') {
  window.gamePlanEditingRef = gamePlanEditing;
}
  const [reminders, setReminders] = useState([]);
  const [currentSession, setCurrentSession] = useState({ week: 1, day: 0 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isNextDayAvailable, setIsNextDayAvailable] = useState(true);
  const [showReminderAlert, setShowReminderAlert] = useState(false);
  const [triggeredReminders, setTriggeredReminders] = useState([]);

  // --- Chat Handler ---
const handleChat = async (input) => {
  try {
    const uid = (auth && auth.currentUser && auth.currentUser.uid) || "anon";
    const reply = await askCoach(input, uid);
    return reply || "I couldn’t find a great match in the knowledge base, try rephrasing?";
  } catch (err) {
    console.error(err);
    return "I’m having trouble reaching the Coach server. Is it still running on http://localhost:8787?";
  }
};



  // --- Firebase state
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Memoize Firebase services
  const { app } = useMemo(() => {
      if (Object.keys(firebaseConfig).length === 0) return { app: null };
      try {
          return { app: initializeApp(firebaseConfig) };
      } catch (e) {
          if (/already exists/.test(e.message)) {
              return { app: initializeApp(firebaseConfig, appId) };
          }
          console.error("Firebase initialization error:", e);
          return { app: null };
      }
  }, []);

  // --- Firebase Auth Listener ---
  useEffect(() => {
      if (!app) return;
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setAuth(authInstance);
      setDb(dbInstance);
      const unsubscribeAuth = onAuthStateChanged(authInstance, (currentUser) => {
          setUser(currentUser);
          setAuthReady(true); // Firebase has checked for a user
      });
      return () => unsubscribeAuth();
  }, [app]);

  // --- Data Fetching and View Routing ---
  useEffect(() => {
      if (!authReady) return; // Wait until auth state is confirmed
      if (!db || !user) {
          setView('login'); // If no user after auth is ready, show login
          return;
      }
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData({
                  progress: data.progress || { week: 1, day: 0 },
                  hasSeenIntro: data.hasSeenIntro || false
              });
              setPaymentStatus(data.paymentStatus || { block2: false, block3: false, gamePlanUnlocked: false });
              setJournalEntries(data.journalEntries || {});
              const plan = data.gamePlan || { purpose: '', affirmations: '', routine: '', resets: '' };
              setGamePlan(plan);
              // Only update draft if user hasn't started editing
              if (!gamePlanEditing.current) {
                setGamePlanDraft(plan);
              }
              setReminders(data.reminders || []);
              const lastCompletionTimestamp = data.lastCompletionTimestamp || null;
              let isAvailable = true;
              if (lastCompletionTimestamp) {
                  const lastCompletionDate = new Date(lastCompletionTimestamp);
                  const today = new Date();
                  if (lastCompletionDate.toDateString() === today.toDateString()) {
                      isAvailable = false;
                  }
              }
              setIsNextDayAvailable(isAvailable);
              if (!data.hasSeenIntro) {
                  setView('introduction');
              } else {
                  setView('dashboard');
              }
          } else {
              const initialData = {
                  email: user.email,
                  displayName: user.displayName,
                  createdAt: new Date().toISOString(),
                  hasSeenIntro: false,
                  progress: { week: 1, day: 0 },
                  paymentStatus: { block2: false, block3: false, gamePlanUnlocked: false },
                  journalEntries: {},
                  gamePlan: { purpose: '', affirmations: '', routine: '', resets: '' },
                  reminders: [],
                  lastCompletionTimestamp: null,
              };
              setDoc(userDocRef, initialData)
                  .catch(e => console.error("Error creating user doc:", e));
              // Snapshot will re-trigger with the new data, setting the view to introduction
          }
      }, (error) => {
          console.error("Error with Firestore snapshot:", error);
          setView('error');
      });
      return () => unsubscribeSnapshot();
  }, [authReady, db, user]);

  // --- Reminder Check Logic ---
  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date();
          const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
          reminders.forEach(reminderTime => {
              if (currentTime === reminderTime && !triggeredReminders.includes(reminderTime)) {
                  setShowReminderAlert(true);
                  setTriggeredReminders(prev => [...prev, reminderTime]);
              }
          });
          // Reset triggered reminders at midnight
          if (currentTime === '00:00') {
              setTriggeredReminders([]);
          }
      }, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [reminders, triggeredReminders]);

  // --- Helper & Handler Functions ---

  // --- Helper & Handler Functions ---
  const getBlockForWeek = (weekNumber) => {
    if (weekNumber >= 1 && weekNumber <= 8) return 1;
    if (weekNumber >= 9 && weekNumber <= 16) return 2;
    if (weekNumber >= 17 && weekNumber <= 24) return 3;
    return 0;
  };

  const getWeekStatus = (weekNumber) => {
    if (!userData) return 'locked';
    if (userData.unlocked) return 'unlocked';
    const block = getBlockForWeek(weekNumber);
    if (block === 2 && !paymentStatus.block2) return 'payment_locked';
    if (block === 3 && !paymentStatus.block3) return 'payment_locked';
    const { week: currentWeek } = userData.progress;
    if (weekNumber < currentWeek) return 'completed';
    if (weekNumber === currentWeek) return 'unlocked';
    return 'locked';
  };

  const getDayStatus = (weekNumber, dayIndex) => {
    if (!userData) return 'locked';
    if (userData.unlocked) return 'unlocked';
    const { week: currentWeek, day: currentDay } = userData.progress;
    if (weekNumber < currentWeek) return 'completed';
    if (weekNumber > currentWeek) return 'locked';
    if (dayIndex < currentDay) return 'completed';
    if (dayIndex === currentDay) return 'unlocked';
    return 'locked';
  };

  const handleWeekClick = (weekNumber) => {
    const status = getWeekStatus(weekNumber);
    if (status === 'payment_locked') {
      setShowPaymentModal(true);
    }
  };

  const startSession = (week, dayIndex) => {
    const status = getWeekStatus(week);
    if (status === 'payment_locked') {
      setShowPaymentModal(true);
      return;
    }
    // Allow navigation to both completed and unlocked days
    if (userData) {
      const { week: currentWeek, day: currentDay } = userData.progress;
      const isCompleted = (week < currentWeek) || (week === currentWeek && dayIndex < currentDay);
      const isUnlocked = (week === currentWeek && dayIndex === currentDay);
      if (isCompleted || isUnlocked) {
        setCurrentSession({ week, day: dayIndex });
        setView('session');
      }
    }
  };

  const completeSession = async () => {
    if (!db || !user) return;
    const { week, day } = currentSession;
    let nextWeek = week;
    let nextDay = day + 1;
    if (nextDay >= courseData[week].days.length) {
      nextDay = 0;
      nextWeek = week + 1;
    }
    if (nextWeek > Object.keys(courseData).length) {
      nextWeek = Object.keys(courseData).length + 1;
      nextDay = 0;
    }
    const newProgress = { week: nextWeek, day: nextDay };
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        progress: newProgress,
        lastCompletionTimestamp: new Date().toISOString()
      }, { merge: true });
      setView('dashboard');
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleJournalChange = async (text) => {
    const { week, day } = currentSession;
    const entryKey = `w${week}d${day}`;
    const prompt = courseData[week].days[day].journalPrompt;
    const newEntry = { prompt, text };
    const updatedEntries = { ...journalEntries, [entryKey]: newEntry };
    setJournalEntries(updatedEntries);
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    try {
      await setDoc(userDocRef, { journalEntries: updatedEntries }, { merge: true });
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
  };

  const handleGamePlanDraftChange = (field, value) => {
        setGamePlanDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleGamePlanSave = async () => {
  setGamePlan(gamePlanDraft);
  if (typeof window !== 'undefined' && window.gamePlanEditingRef) {
    window.gamePlanEditingRef.current = false;
  }
  const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
  try {
    await setDoc(userDocRef, { gamePlan: gamePlanDraft }, { merge: true });
  } catch (error) {
    console.error("Error saving game plan:", error);
  }
};

  const handleRemindersUpdate = async (newReminders) => {
    if (!db || !user) return;
    setReminders(newReminders);
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    try {
      await setDoc(userDocRef, { reminders: newReminders }, { merge: true });
    } catch (error) {
      console.error("Error updating reminders:", error);
    }
  };

  const markIntroAsSeen = async () => {
    if (!db || !user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    try {
      await setDoc(userDocRef, { hasSeenIntro: true }, { merge: true });
      setView('dashboard');
    } catch (error) {
      console.error("Error marking intro as seen:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch(error => console.error("Logout error:", error));
  };

  const handlePayment = async (purchaseOption) => {
    if (!db || !user) return;
    let newPaymentStatus = { ...paymentStatus };
    if (purchaseOption === 'block2') newPaymentStatus.block2 = true;
    else if (purchaseOption === 'block3') {
      newPaymentStatus.block3 = true;
      newPaymentStatus.gamePlanUnlocked = true; // Block 3 includes Game Plan
    }
    else if (purchaseOption === 'gamePlan') newPaymentStatus.gamePlanUnlocked = true;
    else if (purchaseOption === 'both') {
      newPaymentStatus.block2 = true;
      newPaymentStatus.block3 = true;
      newPaymentStatus.gamePlanUnlocked = true;
    }
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    try {
      await setDoc(userDocRef, { paymentStatus: newPaymentStatus }, { merge: true });
      setPaymentStatus(newPaymentStatus);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  // --- Render Logic ---
  const renderView = () => {
      if (!authReady || (user && !userData)) {
          return <LoadingScreen />;
      }
      if (view === 'error') return <ErrorScreen />;
      if (!user) {
          if (view === 'signup') return <SignupPage auth={auth} setView={setView} />;
          return <LoginPage auth={auth} setView={setView} />;
      }
      if (view === 'chat') {
          return (
              <div>
                  <button onClick={() => setView('dashboard')} className="p-2 bg-blue-500 text-white mb-4">
                      Back to Dashboard
                  </button>
                  <ChatBot onSend={handleChat} />
              </div>
          );
      }
      switch (view) {
          case 'introduction':
              return <IntroductionPage onComplete={markIntroAsSeen} />;
          case 'dashboard':
              return (
                  <Dashboard
                      courseData={courseData}
                      getWeekStatus={getWeekStatus}
                      getDayStatus={getDayStatus}
                      startSession={startSession}
                      progress={userData?.progress}
                      handleWeekClick={handleWeekClick}
                      isNextDayAvailable={isNextDayAvailable}
                      openChat={() => setView('chat')}
                  />
              );
          case 'session': {
              const sessionData = courseData[currentSession.week].days[currentSession.day];
              const entryKey = `w${currentSession.week}d${currentSession.day}`;
              return (
                  <DailySession
                      sessionData={sessionData}
                      sessionInfo={currentSession}
                      onComplete={completeSession}
                      onBack={() => setView('dashboard')}
                      journalEntry={journalEntries[entryKey]}
                      onJournalChange={handleJournalChange}
                  />
              );
          }
          case 'journal':
              return <JournalView entries={journalEntries} courseData={courseData} />;
          case 'gamePlan':
              return (
                  <GamePlanView
                      planData={gamePlanDraft}
                      onPlanChange={handleGamePlanDraftChange}
                      onSave={handleGamePlanSave}
                      paymentStatus={paymentStatus}
                      onUnlockRequest={() => setShowPaymentModal(true)}
                  />
              );
          case 'reminders':
              return <RemindersView reminders={reminders} onUpdate={handleRemindersUpdate} />;
          case 'coach':
              return <ChatBot />;
          case 'admin':
              return <AdminPanel db={db} appId={appId} />;
          default:
              return <LoadingScreen />;
      }
  };

  return (

      <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
          {user && view !== 'introduction' && view !== 'login' && view !== 'signup' && <Header onLogout={handleLogout} />}
          <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col">
              {renderView()}
          </main>
          {user && view !== 'introduction' && view !== 'login' && view !== 'signup' && (
              <>
                <NavBar 
                    activeView={view} 
                    setView={setView} 
                />
                {user && user.email === "jeff@mymentalgym.com" && (
                  <button
                    className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-lg z-50"
                    onClick={() => setView('admin')}
                  >
                    Admin
                  </button>
                )}
              </>
          )}
          {showPaymentModal && (
              <PaymentModal 
                  onClose={() => setShowPaymentModal(false)}
                  onPayment={handlePayment}
                  paymentStatus={paymentStatus}
              />
          )}
          {showReminderAlert && (
              <ReminderAlertModal onClose={() => setShowReminderAlert(false)} />
          )}
      </div>
  );
}


const AuthForm = ({ title, buttonText, onSubmit, error, children, onGoogleSignIn }) => (
    <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
            <div className="text-center mb-8">
                <Logo className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="text-gray-400 mt-2">Welcome to Your Mental Gym</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-6">
                {children}
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-200">
                    {buttonText}
                </button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            <button onClick={onGoogleSignIn} className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.59 6.61C13.01 13.38 18.08 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 3.01-2.2 5.57-4.68 7.28l7.46 5.77C44.49 38.33 46.98 32 46.98 24.55z"></path>
                    <path fill="#FBBC05" d="M13.01 26.62c-.57-1.72-.9-3.56-.9-5.49s.33-3.77.9-5.49l-8.59-6.61C2.12 12.4 0 17.86 0 24c0 6.14 2.12 11.6 5.42 15.49l8.59-6.87z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.46-5.77c-2.13 1.42-4.84 2.27-7.97 2.27-5.92 0-10.99-3.88-12.8-9.21l-8.59 6.61C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                Sign in with Google
            </button>
        </div>
    </div>
);

const LoginPage = ({ auth, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        signInWithEmailAndPassword(auth, email, password)
            .catch(err => {
                setError("Invalid email or password. Please try again.");
                console.error("Login Error:", err);
            });
    };
    
    const handleGoogleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(err => {
            setError("Failed to sign in with Google. Please try again.");
            console.error("Google Sign-In Error:", err);
        });
    };

    return (
        <AuthForm title="Login" buttonText="Log In" onSubmit={handleSubmit} error={error} onGoogleSignIn={handleGoogleSignIn}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
            <p className="text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <button type="button" onClick={() => setView('signup')} className="font-semibold text-yellow-400 hover:text-yellow-300">Sign Up</button>
            </p>
        </AuthForm>
    );
};

const SignupPage = ({ auth, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        createUserWithEmailAndPassword(auth, email, password)
            .catch(err => {
                if (err.code === 'auth/email-already-in-use') {
                    setError('This email address is already in use.');
                } else if (err.code === 'auth/weak-password') {
                    setError('Password should be at least 6 characters.');
                } else {
                    setError('Failed to create an account. Please try again.');
                }
                console.error("Signup Error:", err);
            });
    };
    
    const handleGoogleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(err => {
            setError("Failed to sign in with Google. Please try again.");
            console.error("Google Sign-In Error:", err);
        });
    };
    
    return (
        <AuthForm title="Create Account" buttonText="Sign Up" onSubmit={handleSubmit} error={error} onGoogleSignIn={handleGoogleSignIn}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
            <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
            <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button type="button" onClick={() => setView('login')} className="font-semibold text-yellow-400 hover:text-yellow-300">Log In</button>
            </p>
        </AuthForm>
    );
};

const IntroductionPage = ({ onComplete }) => (
    <div className="flex-grow flex items-center justify-center animate-fade-in">
        <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
            <h1 className="text-3xl font-bold text-white text-center mb-4">Welcome to Your Mental Gym</h1>
            <div className="text-gray-300 space-y-4 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                <p><strong className="text-yellow-400">Concept:</strong> Physical talent gets you to the game. Mental strength lets you win it.</p>
                <p><strong className="text-yellow-400">Deeper Dive:</strong> You spend countless hours training your body: lifting, running, and practicing drills until they're perfect. But every top athlete knows that when the pressure is on, the real competition happens in the six inches between your ears. The difference between a good athlete and a great one often comes down to who has the stronger mental game. This course is designed to be your personal mental gym, a place to build the focus, confidence, and resilience that define elite competitors.</p>
                <p>Over the next 24 weeks, you will learn and practice the core principles of sports psychology. Each week builds on the last, creating a comprehensive mental toolkit you can use for the rest of your athletic career.</p>
                <p>Your commitment to these daily exercises is just as important as your commitment to your physical training. The drills are short but powerful. The journaling is designed to create self-awareness, which is the cornerstone of all improvement. By investing a few minutes each day, you are not just learning concepts; you are actively re-wiring your brain for success.</p>
                <p>This journey is about more than just becoming a better athlete; it's about becoming a more focused, resilient, and confident person. The skills you build here will serve you long after you've left the field or court. Welcome to the first day of your new mental training regimen.</p>
            </div>
            <div className="text-center mt-8">
                <button onClick={onComplete} className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Let's Begin
                </button>
            </div>
        </div>
    </div>
);



// --- Core App Components ---

const Header = ({ onLogout }) => (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <Logo className="w-8 h-8 mr-2" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-100 tracking-tight">My Mental Gym</h1>
            </div>
            <button onClick={onLogout} className="flex items-center text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
            </button>
        </div>
    </header>
);


const NavBar = ({ activeView, setView }) => (
  <nav className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 sticky bottom-0 z-30">
    <div className="container mx-auto flex justify-around p-2">
      <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${activeView === 'dashboard' ? 'text-yellow-400' : 'text-gray-400 hover:bg-gray-700'}`}>
        <Home className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Home</span>
      </button>

      <button onClick={() => setView('journal')} className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${activeView === 'journal' ? 'text-yellow-400' : 'text-gray-400 hover:bg-gray-700'}`}>
        <BookOpen className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Journal</span>
      </button>

      <button onClick={() => setView('gamePlan')} className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${activeView === 'gamePlan' ? 'text-yellow-400' : 'text-gray-400 hover:bg-gray-700'}`}>
        <Shield className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Game Plan</span>
      </button>

      <button onClick={() => setView('reminders')} className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${activeView === 'reminders' ? 'text-yellow-400' : 'text-gray-400 hover:bg-gray-700'}`}>
        <Bell className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Reminders</span>
      </button>

      {/* 🏋️‍♂️ Coach Button */}
      <button
        onClick={() => setView('coach')}
        className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
          activeView === 'coach'
            ? 'text-yellow-400'
            : 'text-gray-400 hover:bg-gray-700'
        }`}
      >
        <span className="w-6 h-6 mb-1"><SpeechBubbleIcon className="w-6 h-6" /></span>
        <span className="text-xs font-medium">Coach</span>
      </button>
    </div>
  </nav>
);




const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full flex-grow">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
        <p className="mt-4 text-gray-300">Loading Your Gym...</p>
    </div>
);

const ErrorScreen = () => (
    <div className="flex flex-col items-center justify-center h-full flex-grow bg-red-900/20 p-8 rounded-lg">
        <p className="text-red-400 text-lg font-semibold">An Error Occurred</p>
        <p className="mt-2 text-gray-300 text-center">Could not connect to the Mental Gym. Please refresh the page to try again.</p>
    </div>
);

const Dashboard = ({ courseData, getWeekStatus, getDayStatus, startSession, progress, handleWeekClick, isNextDayAvailable }) => {
    const blocks = [
        { title: "Block 1: The Foundation (Free)", weeks: [1, 2, 3, 4, 5, 6, 7, 8], type: 'free' },
        { title: "Block 2: Advanced Application & Resilience", weeks: [9, 10, 11, 12, 13, 14, 15, 16], type: 'paid' },
        { title: "Block 3: Mastery & Integration", weeks: [17, 18, 19, 20, 21, 22, 23, 24], type: 'paid' },
    ];

    const currentWeek = progress ? progress.week : 1;
    const currentDayIndex = progress ? progress.day : 0;
    
    const isCourseComplete = progress && progress.week > 24;
    const nextSessionDay = !isCourseComplete && courseData[currentWeek] ? courseData[currentWeek].days[currentDayIndex] : null;

    const [showIntro, setShowIntro] = useState(false);
    return (
        <div className="space-y-8">
            {/* Collapsible Introduction Section */}
            <div className="bg-gray-800 border border-yellow-400/50 rounded-xl p-6 shadow-lg">
                <button
                    className="w-full flex items-center justify-between text-2xl font-bold text-yellow-400 mb-4 text-center focus:outline-none"
                    onClick={() => setShowIntro((prev) => !prev)}
                    aria-expanded={showIntro}
                    aria-controls="dashboard-intro-section"
                >
                    <span className="mx-auto">Introduction</span>
                    <span className="ml-2 flex items-center">
                        <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${showIntro ? 'rotate-180' : ''}`} />
                    </span>
                </button>
                {showIntro && (
                    <div id="dashboard-intro-section" className="text-gray-300 space-y-4 leading-relaxed max-w-3xl mx-auto animate-fade-in">
                        <p><strong className="text-yellow-400">Concept:</strong> Physical talent gets you to the game. Mental strength lets you win it.</p>
                        <p><strong className="text-yellow-400">Deeper Dive:</strong> You spend countless hours training your body: lifting, running, and practicing drills until they're perfect. But every top athlete knows that when the pressure is on, the real competition happens in the six inches between your ears. The difference between a good athlete and a great one often comes down to who has the stronger mental game. This course is designed to be your personal mental gym, a place to build the focus, confidence, and resilience that define elite competitors.</p>
                        <p>Over the next 24 weeks, you will learn and practice the core principles of sports psychology, adapted from the timeless wisdom of the Master Key System. We will move from foundational skills like controlling your thoughts and focus, to advanced techniques like high-definition visualization and building unshakable belief in your abilities. Each week builds on the last, creating a comprehensive mental toolkit you can use for the rest of your athletic career.</p>
                        <p>Your commitment to these daily exercises is just as important as your commitment to your physical training. The drills are short but powerful. The journaling is designed to create self-awareness, which is the cornerstone of all improvement. By investing a few minutes each day, you are not just learning concepts; you are actively re-wiring your brain for success.</p>
                        <p>This journey is about more than just becoming a better athlete; it's about becoming a more focused, resilient, and confident person. The skills you build here will serve you long after you've left the field or court. Welcome to the first day of your new mental training regimen. <span className="font-bold text-yellow-400">Let's begin.</span></p>
                    </div>
                )}
            </div>

            {isCourseComplete ? (
                <div className="bg-green-800 border border-green-400/50 rounded-xl p-6 shadow-lg text-center">
                    <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                    <p className="text-green-200 mt-2">You have completed the 24-week Mental Gym program. Continue to use your Journal and Game Plan to keep your mind sharp.</p>
                </div>
            ) : nextSessionDay ? (
                <div className="bg-gray-800 border border-yellow-400/50 rounded-xl p-6 shadow-lg text-center">
                    <h2 className="text-lg font-semibold text-yellow-400">Your Next Session</h2>
                    <p className="text-2xl font-bold mt-2 text-white">{`Week ${currentWeek}: Day ${currentDayIndex + 1}`}</p>
                    <p className="text-gray-300 mt-1">{nextSessionDay.title}</p>
                    <button 
                        onClick={() => startSession(currentWeek, currentDayIndex)}
                        disabled={!isNextDayAvailable}
                        className="mt-6 bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isNextDayAvailable ? 'Start Session' : 'Next Session Unlocks Tomorrow'}
                    </button>
                </div>
            ) : null}

            {blocks.map(block => (
                <div key={block.title}>
                    <h3 className="text-xl font-bold text-gray-300 mb-4 flex items-center">{block.title}
                        {block.type === 'paid' && getWeekStatus(block.weeks[0]) === 'payment_locked' && <Lock className="w-5 h-5 ml-2 text-yellow-400"/>}
                    </h3>
                    <div className="flex flex-col space-y-2">
                        {block.weeks.map(weekNum => (
                            <WeekAccordion
                                key={weekNum}
                                weekNum={weekNum}
                                weekData={courseData[weekNum]}
                                status={getWeekStatus(weekNum)}
                                getDayStatus={getDayStatus}
                                startSession={startSession}
                                handleWeekClick={handleWeekClick}
                                isCurrentWeek={weekNum === currentWeek && !isCourseComplete}
                                isNextDayAvailable={isNextDayAvailable}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {isCourseComplete && <JourneyContinues />}
        </div>
    );
};

const WeekAccordion = ({ weekNum, weekData, status, getDayStatus, startSession, handleWeekClick, isCurrentWeek, isNextDayAvailable }) => {
    const [isOpen, setIsOpen] = useState(isCurrentWeek);

    const handleHeaderClick = () => {
        if (status === 'payment_locked') {
            handleWeekClick(weekNum);
        } else if (status === 'unlocked' || status === 'completed') {
            setIsOpen(!isOpen);
        }
    };

    const headerColor = status === 'completed' ? 'bg-green-800/50' : status === 'unlocked' ? 'bg-yellow-800/50' : 'bg-gray-800/50';
    const borderColor = status === 'completed' ? 'border-green-700' : status === 'unlocked' ? 'border-yellow-700' : 'border-gray-700';
    const cursor = (status === 'unlocked' || status === 'completed' || status === 'payment_locked') ? 'cursor-pointer' : 'cursor-default';

    return (
        <div className={`rounded-lg border ${borderColor} ${headerColor} transition-all duration-300`}>
            <div className={`flex items-center justify-between p-4 ${cursor}`} onClick={handleHeaderClick}>
                <div className="flex items-center">
                    <span className="font-bold text-lg text-white mr-4">Week {weekNum}</span>
                    <span className="text-sm text-gray-300 hidden sm:block">{weekData.title}</span>
                </div>
                <div className="flex items-center">
                    {status === 'payment_locked' ? <Lock className="w-5 h-5 text-yellow-400" /> :
                     <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />}
                </div>
            </div>
            {isOpen && (status === 'unlocked' || status === 'completed') && (
                <div className="border-t border-gray-700/50">
                    <div className="p-4 bg-black/10">
                        <h4 className="font-semibold text-yellow-400 mb-2">This Week's Focus</h4>
                        <p className="text-sm text-gray-300">{weekData.weeklyIntro}</p>
                    </div>
                    <div className="p-4 space-y-2">
                        {weekData.days.map((day, dayIndex) => {
                            const dayStatus = getDayStatus(weekNum, dayIndex);
                            const isDisabled = dayStatus === 'locked' || (dayStatus === 'unlocked' && !isNextDayAvailable);
                            return (
                                <button 
                                    key={dayIndex} 
                                    onClick={() => startSession(weekNum, dayIndex)}
                                    disabled={isDisabled}
                                    className={`w-full flex items-center text-left p-3 rounded-md transition-colors ${
                                        dayStatus === 'unlocked' && isNextDayAvailable ? 'bg-gray-700/50 hover:bg-gray-600/50' : 
                                        dayStatus === 'completed' ? 'text-gray-400' : 
                                        'text-gray-500'
                                    }`}
                                >
                                    {dayStatus === 'completed' ? <CheckCircle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" /> : 
                                     dayStatus === 'unlocked' && isNextDayAvailable ? <div className="w-5 h-5 mr-3 flex-shrink-0 relative flex items-center justify-center"><Circle className="w-5 h-5 text-yellow-400" /><div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div></div> :
                                     <Circle className="w-5 h-5 mr-3 text-gray-600 flex-shrink-0" />}
                                    <span className="flex-grow">{`Day ${dayIndex + 1}: ${day.title}`}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const DailySession = ({ sessionData, sessionInfo, onComplete, onBack, journalEntry, onJournalChange }) => {
  const [localText, setLocalText] = useState(journalEntry?.text || '');
  const topRef = React.useRef(null);
  useEffect(() => {
    setLocalText(journalEntry?.text || '');
  }, [journalEntry]);
  // Scroll to top when sessionInfo changes (new day/session)
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [sessionInfo]);
  return (
    <div ref={topRef} className="bg-gray-800 rounded-xl p-6 shadow-lg animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm text-yellow-400 hover:text-yellow-300 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>
      <div className="text-center mb-6">
        <p className="text-gray-400 font-semibold">{`Week ${sessionInfo.week} - Day ${sessionInfo.day + 1}`}</p>
        <h2 className="text-3xl font-bold text-white mt-1">{sessionData.title}</h2>
      </div>

            <div className="bg-gray-900/50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Instructions</h3>
                <p className="text-gray-200 leading-relaxed">{sessionData.instructions}</p>
            </div>
            
            <div className="bg-gray-900/50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Deeper Dive</h3>
                <p className="text-gray-300 leading-relaxed">{sessionData.deeperDive}</p>
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Master Journal</h3>
                <p className="text-sm text-gray-400 mb-4">{sessionData.journalPrompt}</p>
                <textarea
  value={localText}
  onChange={(e) => setLocalText(e.target.value)}
  onBlur={() => onJournalChange(localText)}
  className="w-full h-40 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-shadow"
  placeholder="Record your thoughts here..."
/>
            </div>

            <div className="mt-8 text-center">
                <button 
                    onClick={onComplete}
                    disabled={!localText.trim()}
                    className="bg-green-500 text-white font-bold py-3 px-10 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    Complete Session
                </button>
            </div>
        </div>
    );
};

const JournalView = ({ entries, courseData }) => {
    const sortedEntries = Object.keys(entries)
        .filter(key => entries[key] && entries[key].text)
        .map(key => {
            const match = key.match(/w(\d+)d(\d+)/);
            if (!match) return null;
            return {
                week: parseInt(match[1]),
                day: parseInt(match[2]),
                prompt: entries[key].prompt,
                text: entries[key].text
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.week - b.week) || (a.day - b.day));

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Master Journal</h2>
            {sortedEntries.length === 0 ? (
                <p className="text-center text-gray-400 mt-8">Your journal is empty. Complete sessions to add entries.</p>
            ) : (
                <div className="space-y-6">
                    {sortedEntries.map(entry => (
                        <div key={`w${entry.week}d${entry.day}`} className="bg-gray-800 p-5 rounded-lg shadow">
                            <p className="text-sm font-semibold text-yellow-400">{`Week ${entry.week}, Day ${entry.day + 1}: ${courseData[entry.week]?.days[entry.day]?.title || 'Entry'}`}</p>
                            <p className="mt-3 text-gray-400 italic">"{entry.prompt}"</p>
                            <p className="text-gray-200 mt-2 whitespace-pre-wrap">{entry.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- GamePlanInput Component ---
const GamePlanInput = ({ label, question, value, field, onChange }) => {
    return (
        <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
                <label className="block text-lg font-bold text-yellow-400">{label}</label>
                <span className="text-sm text-gray-300 italic">{question}</span>
            </div>
            <textarea
              value={value}
              onChange={e => onChange(field, e.target.value)}
              onFocus={() => {
                if (typeof window !== 'undefined' && window.gamePlanEditingRef) {
                  window.gamePlanEditingRef.current = true;
                }
              }}
              onBlur={() => {
                if (typeof window !== 'undefined' && window.gamePlanEditingRef) {
                  window.gamePlanEditingRef.current = false;
                }
              }}
              className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-shadow"
            />
        </div>
    );
};

// --- GamePlanView Component ---
const GamePlanView = ({ planData, onPlanChange, paymentStatus, onUnlockRequest, onSave }) => {
    const isUnlocked = paymentStatus.gamePlanUnlocked || paymentStatus.block3;
    if (!isUnlocked) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg flex-grow flex flex-col justify-center items-center">
                <Shield className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                <h2 className="text-2xl font-bold text-white">My Mental Game Plan</h2>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">This is your personal blueprint for mental toughness. As you progress through the course, you'll capture your most important strategies here.</p>
                <ul className="text-left list-disc list-inside my-6 text-gray-300 space-y-2">
                    <li>Your Purpose Statement</li>
                    <li>Core Affirmations</li>
                    <li>Pre-Game Routine</li>
                    <li>In-Game Reset Strategies</li>
                </ul>
                <button onClick={onUnlockRequest} className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Unlock Game Plan
                </button>
            </div>
        );
    }
    return (
        <div className="animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">My Mental Game Plan</h2>
            <GamePlanInput 
                label="My Purpose Statement" 
                question="What is your 'Why'?" 
                value={planData.purpose} 
                field="purpose" 
                onChange={onPlanChange} 
            />
            <GamePlanInput 
                label="Core Affirmations" 
                question="What powerful truths will you remind yourself of?" 
                value={planData.affirmations} 
                field="affirmations" 
                onChange={onPlanChange} 
            />
            <GamePlanInput 
                label="Pre-Game Routine" 
                question="What is your mental warm-up?" 
                value={planData.routine} 
                field="routine" 
                onChange={onPlanChange} 
            />
            <GamePlanInput 
                label="In-Game Reset Strategies" 
                question="How will you reset after a mistake or during a timeout?" 
                value={planData.resets} 
                field="resets" 
                onChange={onPlanChange} 
            />
            <div className="text-center mt-6">
                <button onClick={typeof onSave === 'function' ? onSave : undefined} className="bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg">
                    Save
                </button>
            </div>
        </div>
    );
};

const PaymentModal = ({ onClose, onPayment, paymentStatus }) => {
    const [selected, setSelected] = useState(null);
    const [paid, setPaid] = useState(false);
    const priceMap = {
        gamePlan: { amount: 1499, label: 'Unlock Game Plan - $14.99' },
        block2: { amount: 4999, label: 'Unlock Block 2 - $49.99' },
        block3: { amount: 4999, label: 'Unlock Block 3 (includes Game Plan) - $49.99' },
        both: { amount: 7499, label: 'Unlock All Content (Save 25%) - $74.99' }
    };
    const handleSuccess = () => {
        setPaid(true);
        if (selected) onPayment(selected);
    };
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-md m-4 border border-yellow-400/30">
                <h2 className="text-2xl font-bold text-center text-white mb-2">Unlock More Content</h2>
                <p className="text-center text-gray-400 mb-6">Take your mental game to the next level.</p>
                {!selected && !paid && (
                  <div className="space-y-4">
                    {!paymentStatus.gamePlanUnlocked && !paymentStatus.block3 && (
                        <button onClick={() => setSelected('gamePlan')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <h3 className="font-bold text-yellow-400">Unlock Game Plan - $14.99</h3>
                            <p className="text-sm text-gray-300">Your personal blueprint for mental toughness.</p>
                        </button>
                    )}
                    {!paymentStatus.block2 && (
                        <button onClick={() => setSelected('block2')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <h3 className="font-bold text-yellow-400">Unlock Block 2 - $49.99</h3>
                            <p className="text-sm text-gray-300">Weeks 9-16: Advanced Application & Resilience</p>
                        </button>
                    )}
                    {!paymentStatus.block3 && (
                        <button onClick={() => setSelected('block3')} className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                            <h3 className="font-bold text-yellow-400">Unlock Block 3 (includes Game Plan) - $49.99</h3>
                            <p className="text-sm text-gray-300">Weeks 17-24: Mastery & Integration</p>
                        </button>
                    )}
                    {(!paymentStatus.block2 || !paymentStatus.block3) && (
                        <button onClick={() => setSelected('both')} className="w-full text-left p-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg transition-all text-white shadow-lg">
                            <h3 className="font-bold flex items-center"><Zap className="w-5 h-5 mr-2"/>Unlock All Content (Save 25%) - $74.99</h3>
                            <p className="text-sm text-yellow-100">Get lifetime access to the complete program.</p>
                        </button>
                    )}
                  </div>
                )}
                {selected && !paid && (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={priceMap[selected].amount}
                      label={priceMap[selected].label}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                )}
                {paid && (
                  <div className="text-green-400 text-center font-bold my-6">Payment successful! Unlocking content...</div>
                )}
                <div className="text-center mt-6">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

const JourneyContinues = () => (
    <div className="bg-gray-800 border border-blue-400/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-4">The Journey Continues</h2>
        <div className="text-gray-300 space-y-4">
            <p><strong className="text-blue-400">Concept:</strong> You have successfully completed the 24-week program. But this is not the end; it's the beginning. Mental strength, like physical strength, requires consistent training. The tools you've learned are now part of your permanent toolkit.</p>
            <p><strong className="text-blue-400">Deeper Dive:</strong> Just as you don't stop lifting weights after one season, you don't stop mental training after one course. Consistency is the key to making these skills second nature. Continue to use your Performance Prime Routine before every game. Revisit the visualization and focus drills whenever you face a new challenge. Your mind is your greatest athletic asset—keep it sharp. The journey to mental mastery is ongoing, and you now have the map.</p>
        </div>
    </div>
);

const RemindersView = ({ reminders, onUpdate }) => {
    const [newTime, setNewTime] = useState('');

    const addReminder = () => {
        if (newTime && !reminders.includes(newTime)) {
            const updatedReminders = [...reminders, newTime].sort();
            onUpdate(updatedReminders);
            setNewTime('');
        }
    };

    const deleteReminder = (timeToDelete) => {
        const updatedReminders = reminders.filter(time => time !== timeToDelete);
        onUpdate(updatedReminders);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Daily Reminders</h2>
            <p className="text-center text-gray-400 mb-6 text-sm max-w-md mx-auto">Please note: These are in-app reminders and will only appear if the app is open at the scheduled time.</p>
            
            <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
                <div className="flex gap-2 mb-4">
                    <input 
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                    <button onClick={addReminder} className="bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
                        Add
                    </button>
                </div>
                
                <div className="space-y-2">
                    {reminders.length > 0 ? (
                        reminders.map(time => (
                            <div key={time} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md">
                                <span className="text-lg font-medium text-white">{formatTime(time)}</span>
                                <button onClick={() => deleteReminder(time)} className="text-gray-400 hover:text-red-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 pt-4">No reminders set.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReminderAlertModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-sm m-4 border border-yellow-400/30 text-center">
            <Bell className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Reminder!</h2>
            <p className="text-gray-300 mb-6">It's time for your daily Mental Gym session.</p>
            <button onClick={onClose} className="bg-yellow-400 text-gray-900 font-bold py-2 px-8 rounded-lg hover:bg-yellow-300 transition-colors">
                Dismiss
            </button>
        </div>
    </div>
);

