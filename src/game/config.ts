// =====================================================================
//  ✏️  EDIT ME — everything personal about the game lives in this file.
//  - Replace the photos in /public/photos (memory-1.jpg ... memory-6.jpg)
//    with your own pictures (same file names, or change `photo` below).
//  - Change the captions / titles of the six memory houses.
//  - Change the finale letter at the bottom.
//
//  This month's theme: her KUKAI cardigan collection.
//    I   — Grey Roselle          (photo 1)
//    II  — Pink Estelle          (photo 2)
//    III — White Eloise          (photo 3)
//    IV  — Emerald Estelle       (photo 4)
//    V   — Black Camellia        (photo 5)
//    VI  — Butter Yellow Valerie — NOT ARRIVED YET, still on its way.
//          Photo 6 is meant to be the order screenshot. You don't have to
//          change any code: `status: "on-the-way"` just adds the ribbon and
//          swaps the missing-photo placeholder to a parcel.
//
//  ⚠️ The village has exactly six doorways in a ring around the fountain.
//  If you ever want only five, delete a MEMORIES entry — that house simply
//  becomes a plain, non-interactive cottage (world.ts keeps it as scenery,
//  no gap in the map, no crash).
// =====================================================================
import type { Look, Dir, CatCoat } from "./sprites";

export type Reaction =
  | "jump"
  | "spin"
  | "bow"
  | "blush"
  | "dance"
  | "shake"
  | "cry"
  | "salute"
  | "wave"
  | "gasp"
  | "laugh"
  | "cheer";

export const MONTHS = 16;

/** The collection these six doorways are about. */
export const COLLECTION = {
  brand: "KUKAI",
  label: "this month's cardigan collection",
};

export interface Memory {
  id: "nw" | "w" | "sw" | "n" | "ne" | "e";
  title: string;
  tag: string;
  caption: string;
  photo: string;
  /** "on-the-way" = bought, but the parcel hasn't landed yet. */
  status?: "here" | "on-the-way";
  /**
   * CSS object-position for the 4:5 polaroid frame. Phone shots are much
   * taller than 4:5, so `cover` trims the top/bottom — nudge this upward
   * (e.g. "center 30%") to keep her head and the cardigan in the frame.
   */
  focus?: string;
}

export const MEMORIES: Memory[] = [
  {
    id: "nw",
    title: "Grey Roselle",
    tag: "Cardigan I",
    caption: "The first box of the month. Grey, quiet, understated — and then you put it on and it became the prettiest thing in the world. Some clothes are just lucky to be worn by you.",
    photo: "/photos/memory-1.jpg",
    focus: "center 45%",
  },
  {
    id: "w",
    title: "Pink Estelle",
    tag: "Cardigan II",
    caption: "Pink was always your colour. You walked past the fountain in it and even the flowers looked like they were taking notes.",
    photo: "/photos/memory-2.jpg",
    focus: "center 35%",
  },
  {
    id: "sw",
    title: "White Eloise",
    tag: "Cardigan III",
    caption: "White and calm, like the village on a slow morning. You make simple things look like they were made for you — because they were.",
    photo: "/photos/memory-3.jpg",
    focus: "center 28%",
  },
  {
    id: "ne",
    title: "Emerald Estelle",
    tag: "Cardigan IV",
    caption: "Green like the garden after rain. I saw you in it and forgot the sentence I was halfway through saying. I still haven't remembered it.",
    photo: "/photos/memory-4.jpg",
    focus: "center 31%",
  },
  {
    id: "e",
    title: "Black Camellia",
    tag: "Cardigan V",
    caption: "Sleek, a little dramatic, impossible to look away from. You in black is my favourite plot twist of the month.",
    photo: "/photos/memory-5.jpg",
    focus: "center 28%",
  },
  {
    id: "n",
    title: "Butter Yellow Valerie",
    tag: "Cardigan VI",
    caption: "Not here yet — but already my favourite, because it's still travelling to you. When the yellow box finally lands on the doorstep, wear it once and let me say it out loud: you're the loveliest thing this month, cardigan or not.",
    photo: "/photos/memory-6.jpg",
    status: "on-the-way",
  },
];

// ---------------------------------------------------------------------
//  Cats of Loveberry Village
//  Five cats, each with its own coat — two or three colours apiece, so
//  nobody is a flat blob. They answer in a proper dialogue box, in meows,
//  purrs and the occasional hiss.
// ---------------------------------------------------------------------
export interface CatDef {
  id: string;
  name: string;
  /** shown in the dialogue box under the name, just like the villagers */
  title: string;
  x: number;
  y: number;
  /** what this cat says when the Princess comes to say hello */
  cries: string[];
  /** base + patch + white (+ optional third colour) */
  coat: CatCoat;
}

export const CATS: CatDef[] = [
  {
    id: "ciro",
    name: "Ciro",
    title: "Village cat",
    x: 300,
    y: 470,
    cries: ["Mrrrow", "Prrrrr", "Mew?"],
    // light orange & white
    coat: {
      id: "ciro",
      base: "#f7b06a",
      patch: "#e08a3c",
      white: "#fff8ee",
      eye: "#4a3222",
    },
  },
  {
    id: "cila",
    name: "Cila",
    title: "Village cat",
    x: 640,
    y: 470,
    cries: ["Mew mew", "Prrrr", "Mrrp!"],
    // light brown & white
    coat: {
      id: "cila",
      base: "#eed0a8",
      patch: "#d9aa79",
      white: "#fffaf3",
      eye: "#5a4330",
    },
  },
  {
    id: "rocky",
    name: "Rocky (dombel/tompel)",
    title: "Village cat",
    x: 250,
    y: 300,
    cries: ["Hsss!", "Mrow", "Prrrr"],
    // black & white, with amber eyes
    coat: {
      id: "rocky",
      base: "#3c3944",
      patch: "#2a2732",
      white: "#f9f5ee",
      eye: "#f2c14e",
    },
  },
  {
    id: "momo",
    name: "Momo",
    title: "Sunbeam chaser",
    x: 560,
    y: 280,
    cries: ["Meow", "Meww", "Mrrp"],
    // light brown, with a toffee saddle
    coat: {
      id: "momo",
      base: "#e9bb7c",
      patch: "#bf8c4c",
      white: "#fdf4e6",
      eye: "#4a3222",
    },
  },
  {
    id: "mochi",
    name: "Mochi",
    title: "Village cat",
    x: 700,
    y: 360,
    cries: ["Mew?", "Mrrp", "Prrr"],
    // white, grey & black — three colours
    coat: {
      id: "mochi",
      base: "#fbf7ef",
      patch: "#b9b3bd",
      spot: "#302c37",
      white: "#ffffff",
      eye: "#3a3442",
    },
  },
];

export const FINALE = {
  title: `Happy ${MONTHS} Months, Princess`,
  letter: [
    "My dearest Princess,",
    `${MONTHS} months ago my life got so much brighter. Every laugh, every hug, every silly little moment with you is my favourite thing in the world.`,
    "Thank you for being patient with me, for believing in me, and for loving me exactly as I am.",
    "This whole village is just a tiny piece of how much I adore you. I can't wait to build a thousand more memories with you.",
    "Five cardigans on the shelf, one still on its way — and every single one of them is just an excuse to say it again: you're the prettiest thing in the world.",
    "Forever yours,",
    "— Your Dudut",
  ],
};

// ---------------------------------------------------------------------
//  Villagers
// ---------------------------------------------------------------------
export interface Topic {
  label: string;
  react: Reaction;
  reply: string[];
}

export type Behavior = "wander" | "work" | "carry";
export type Job = "hammer" | "hang" | "paint" | "carry";

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  look: Look;
  x: number;
  y: number;
  radius: number;
  behavior: Behavior;
  job?: Job;
  route?: [number, number][];
  speed?: number;
  voice: number;
  facing?: Dir;
  greet: string[];
  intro?: { text: string; react: Reaction }[];
  topics: Topic[];
  farewell: string;
  exit?: string;
  decorator?: boolean;
}

export const PRINCESS_LOOK: Look = {
  id: "princess",
  skin: "#f7d0b0",
  hair: "#6b3a26",
  style: "long",
  top: "#ff6f9f",
  bottom: "#ff9ec4",
  dress: true,
  acc: "crown",
  stripe: "#fff3f8",
  shoes: "#c04a6a",
};

export const PLAYER_START = { x: 448, y: 646 };

export const NPCS: NpcDef[] = [
  {
    id: "pip",
    name: "Pip",
    title: "Royal Herald",
    look: { id: "pip", skin: "#f3c9a5", hair: "#c8571f", style: "short", top: "#3b63d9", stripe: "#ffd84d", bottom: "#2a3f8f", acc: "feather", accCol: "#3b63d9" },
    x: 448,
    y: 614,
    radius: 46,
    behavior: "wander",
    facing: 0,
    voice: 330,
    exit: "I'm ready to explore!",
    intro: [
      { text: "Hear ye, hear ye! Oh! P-Princess! You've arrived!", react: "gasp" },
      { text: "Welcome to Loveberry Village! Our Master, the Prince, has been planning this day for ages.", react: "bow" },
      { text: `Today marks ${MONTHS} glorious months since the Prince and his Princess found each other!`, react: "cheer" },
      { text: "The whole village has been preparing... though, ahem, a few of us are still hanging the last decorations. Please forgive the mess!", react: "shake" },
      { text: "Master left a little memory inside each house for you. Walk up to a door and open it, Princess!", react: "jump" },
    ],
    greet: [
      "Princess! Happy sixteen months! Master would be so proud you're here!",
      "Hear ye! The Princess walks among us! Congratulations on your monthversary!",
      "Oh, Princess! Every door in the village holds a gift from our Master!",
    ],
    topics: [
      {
        label: "Who are you?",
        react: "salute",
        reply: ["I am Pip, Royal Herald of Loveberry! I announce the Prince's good news, and today there is a LOT of it!"],
      },
      {
        label: "Where is the Prince?",
        react: "blush",
        reply: ["Master? Hehe... he's always with you in spirit, Princess. He built every corner of this village with you in his heart."],
      },
      {
        label: "Is all this for me?",
        react: "cry",
        reply: [
          "Every petal, every lantern, every heart-shaped cobblestone. All for you, Princess.",
          "Sniff... forgive me, I'm just so happy for you both!",
        ],
      },
    ],
    farewell: "Splendid! Off you go, Princess! Master's memories are waiting behind every door.",
  },
  {
    id: "rosa",
    name: "Rosa",
    title: "Village Baker",
    look: { id: "rosa", skin: "#f2c4a0", hair: "#7a3b1c", style: "bun", top: "#ff8fb7", bottom: "#ffb3cf", dress: true, apron: "#ffffff", acc: "chef" },
    x: 150,
    y: 482,
    radius: 56,
    behavior: "wander",
    voice: 400,
    greet: [
      "Princess! Happy 16 months! Master ordered a heart-shaped cake just for you!",
      "Oh my, it's the Princess! Sixteen months of love, and I baked all morning for you!",
      "Princess! Congratulations to you and our dear Master, the Prince!",
    ],
    topics: [
      { label: "What smells so good?", react: "jump", reply: ["Strawberry heart tarts! Master tasted twelve recipes to pick your favourite. He's very serious about sweets, our Prince."] },
      { label: "Any secrets about the Prince?", react: "blush", reply: ["He asked me for the sweetest recipe in the world. I said, 'Master, just think of her.' He turned red as a tomato!"] },
      { label: "Can I have a tart?", react: "dance", reply: ["Of course, Princess! *twirls* Here's one made with sixteen spoonfuls of love."] },
    ],
    farewell: "Come back for cake anytime, Princess!",
  },
  {
    id: "gus",
    name: "Gus",
    title: "Gardener",
    look: { id: "gus", skin: "#e8b58d", hair: "#5a3a26", style: "short", top: "#d94f4f", bottom: "#3f7d4a", acc: "straw", accCol: "#d94f4f", beard: "#6b4a2e", stripe: "#3f7d4a" },
    x: 310,
    y: 590,
    radius: 50,
    behavior: "wander",
    voice: 150,
    greet: [
      "Well, bless my boots! Princess! Congratulations on sixteen months!",
      "Evenin', Princess! Master grew these roses himself. Well... I helped. A little.",
      "Happy monthversary, Princess! Mind the flowers!",
    ],
    topics: [
      { label: "These flowers are lovely!", react: "blush", reply: ["Master wanted one rose for every month, then got carried away and planted a hundred more. That's love for ya!"] },
      { label: "Did the Prince really help?", react: "laugh", reply: ["Ha! He got mud all over his royal boots and grinned ear to ear. Never seen a happier prince!"] },
      { label: "Thank you, Gus", react: "salute", reply: ["Anything for you and Master, Princess! Long live love!"] },
    ],
    farewell: "Take care, Princess! Watch for thorns!",
  },
  {
    id: "bram",
    name: "Sir Bram",
    title: "Village Guard",
    look: { id: "bram", skin: "#e8bd98", hair: "#3a2a20", style: "short", top: "#6e86b5", armor: true, bottom: "#4b5877", acc: "helmet", stripe: "#d9b44a" },
    x: 448,
    y: 492,
    radius: 66,
    behavior: "wander",
    voice: 120,
    greet: [
      "Halt! ...Oh! Princess! Forgive me. Congratulations on sixteen months!",
      "Princess! The village is safe, and so is your happiness. Master's orders!",
      "All hail the Princess! Master would be delighted you're here.",
    ],
    topics: [
      { label: "Any trouble today?", react: "salute", reply: ["None, Princess. Only a very sneaky rabbit stole a rose. I am investigating. Very seriously."] },
      { label: "Are you scared of anything?", react: "shake", reply: ["N-nothing! ...except Rosa when the tarts run out. And disappointing Master. Not that he'd ever show it."] },
      { label: "Tell me about the Prince", react: "cry", reply: ["Master is the bravest, kindest soul in the realm. And when he talks about you, Princess... I tear up inside this helmet. Sniff."] },
    ],
    farewell: "Stay safe, Princess! I'll guard your happiness!",
  },
  {
    id: "lily",
    name: "Lily",
    title: "Flower Girl",
    look: { id: "lily", skin: "#f7d0b0", hair: "#e8b04a", style: "pony", top: "#ffe27a", bottom: "#ffd84d", dress: true, acc: "flowers" },
    x: 400,
    y: 392,
    radius: 70,
    behavior: "wander",
    voice: 460,
    greet: [
      "Princess! Princess! Happy sixteen months! I picked these just for you!",
      "Ooh, the Princess! Master told me you love pink flowers!",
      "Congratulations, Princess! You and the Prince are my favourite love story!",
    ],
    topics: [
      { label: "Can I have a flower?", react: "dance", reply: ["Yes yes yes! *twirls* A flower for the most beautiful Princess in the realm!"] },
      { label: "What's your favourite colour?", react: "spin", reply: ["Pink! Because it's the colour of you and Master's love story! Wheee!"] },
      { label: "Do you know a secret?", react: "blush", reply: ["Shhh... Master practiced his love letter on me forty times. I cried at every single one!"] },
    ],
    farewell: "Bye bye, Princess! Don't forget to smell the roses!",
  },
  {
    id: "tobin",
    name: "Tobin",
    title: "Travelling Bard",
    look: { id: "tobin", skin: "#dba982", hair: "#3a2a20", style: "curly", top: "#7b4fb3", bottom: "#4a3a6a", acc: "feather", accCol: "#c0392b", stripe: "#ffd84d" },
    x: 535,
    y: 596,
    radius: 44,
    behavior: "wander",
    voice: 260,
    greet: [
      "Ah, the Princess! A song for you, and for our Master, the Prince! Happy sixteen months!",
      "Princess! The bard Tobin congratulates you with all his strings!",
      "Behold, the Princess! Master's love story is the best ballad I know!",
    ],
    topics: [
      { label: "Sing me a song!", react: "dance", reply: [" Sixteen moons and still they stay, hand in hand, come what may.", " A prince, a princess, a love so true... and the whole village sings for you!"] },
      { label: "Did Master write a song?", react: "gasp", reply: ["He tried! Forty verses. Thirty-nine of them were just your name. It was my favourite song ever."] },
      { label: "Play something sad", react: "cry", reply: [" Oh the days when they were apart... Sniff... no, no, too sad. Happy endings only, Princess!"] },
    ],
    farewell: "May your heart always have a melody, Princess!",
  },
  {
    id: "milo",
    name: "Milo",
    title: "Village Kid",
    look: { id: "milo", skin: "#f2c4a0", hair: "#2b2b2b", style: "short", top: "#4aa8ff", bottom: "#6b4a2e", acc: "cap", accCol: "#e0384f", scale: 0.82 },
    x: 700,
    y: 340,
    radius: 80,
    behavior: "wander",
    speed: 34,
    voice: 520,
    greet: [
      "Princess! Princess! Happy monthversary! Did you see the hearts everywhere?!",
      "Whoa, it's the Princess! Master said I could stay up late for this!",
      "Hi Princess! Congrats! Master says you're the best thing that ever happened to him!",
    ],
    topics: [
      { label: "What are you doing?", react: "jump", reply: ["Collecting rose petals! Master gave me a gold coin to scatter them. I kept some for myself. Don't tell!"] },
      { label: "Do you like the Prince?", react: "cheer", reply: ["He's my hero! He taught me how to skip stones. He says you taught him how to love."] },
      { label: "Race me!", react: "spin", reply: ["Ready... set... *spins* ...I win! Wheee! I'm too dizzy to run!"] },
    ],
    farewell: "Bye Princess! Come play again!",
  },
  {
    id: "may",
    name: "Granny May",
    title: "Village Elder",
    look: { id: "may", skin: "#f3d1b3", hair: "#d9d9e0", style: "bun", top: "#a98bd6", bottom: "#8a6bb8", dress: true, acc: "bonnet", accCol: "#c9b3ee" },
    x: 742,
    y: 262,
    radius: 42,
    behavior: "wander",
    speed: 14,
    voice: 210,
    greet: [
      "Oh, my dear Princess! Sixteen months! It feels like yesterday the Prince first spoke of you.",
      "Princess, dearie! Congratulations to you and our dear Master!",
      "Come closer, Princess. Granny May has a blessing for you both.",
    ],
    topics: [
      { label: "Any advice for us?", react: "bow", reply: ["Laugh together, dearie. Forgive quickly. And never go to bed angry. That's what kept me and my husband smiling for fifty years."] },
      { label: "Remember the Prince as a kid?", react: "laugh", reply: ["Ha! Master was a very shy little prince. Now he talks about you for hours! Oh, my heart."] },
      { label: "You're so sweet, Granny", react: "blush", reply: ["Oh stop it, dearie, you'll make an old lady blush! ...Have a sugar cookie."] },
    ],
    farewell: "Take care, my dear Princess. Love is the best magic.",
  },
  {
    id: "hob",
    name: "Hob",
    title: "Carpenter",
    look: { id: "hob", skin: "#d9a47d", hair: "#4a3226", style: "short", top: "#c28a4a", bottom: "#5a4632", acc: "hardhat", beard: "#4a3226", apron: "#8a5a34" },
    x: 752,
    y: 624,
    radius: 0,
    behavior: "work",
    job: "hammer",
    facing: 1,
    voice: 140,
    decorator: true,
    greet: [
      "P-Princess?! Oh no, forgive us! The decorations aren't finished yet! Master will have my head!",
      "Princess! Please don't look! This house is still half done. I'm so sorry!",
      "Oh dear, oh dear! The Princess is here and the heart-sign isn't even up! Apologies!",
    ],
    topics: [
      { label: "It already looks beautiful!", react: "cry", reply: ["R-really? You're too kind, Princess. Sniff... I'll hammer even harder for you!"] },
      { label: "Can I help hammer?", react: "shake", reply: ["A Princess hammering nails?! Master would never forgive me! Please, enjoy the village!"] },
      { label: "Take your time", react: "bow", reply: ["Bless you, Princess. I promise it'll be perfect before sunset. For you and Master!"] },
    ],
    farewell: "Back to work! Sorry again, Princess!",
  },
  {
    id: "wren",
    name: "Wren",
    title: "Seamstress",
    look: { id: "wren", skin: "#f2c4a0", hair: "#3b2a5a", style: "pony", top: "#4fb3a9", bottom: "#6fd0c4", dress: true, acc: "bandana", accCol: "#ff6b8b" },
    x: 519,
    y: 322,
    radius: 0,
    behavior: "work",
    job: "hang",
    facing: 1,
    voice: 430,
    decorator: true,
    greet: [
      "Eek! Princess! I'm so sorry, the garlands aren't fully hung yet! Please forgive me!",
      "Oh! P-Princess! I wasn't ready! The bunting is still crooked. Sorry sorry sorry!",
      "Princess! Master told us everything must be perfect, and I'm running late! Forgive me!",
    ],
    topics: [
      { label: "The garland is gorgeous!", react: "spin", reply: ["Do you think so?! I sewed every heart by hand! Oh, this makes me so happy!"] },
      { label: "Careful on that ladder!", react: "gasp", reply: ["Eep! I'm fine, I'm fine! ...Maybe hold the ladder? No, no, a Princess shouldn't!"] },
      { label: "No need to apologise", react: "blush", reply: ["You're far too kind, Princess. Master chose well. Truly."] },
    ],
    farewell: "Almost done! Enjoy the village, Princess!",
  },
  {
    id: "dex",
    name: "Dex",
    title: "Painter",
    look: { id: "dex", skin: "#e8b58d", hair: "#e0384f", style: "curly", top: "#ffffff", bottom: "#3a3a6a", apron: "#f5ecd8", acc: "cap", accCol: "#4aa8ff" },
    x: 690,
    y: 374,
    radius: 0,
    behavior: "work",
    job: "paint",
    facing: 2,
    voice: 300,
    decorator: true,
    greet: [
      "Gah! Princess! Don't look at the painting, it's not finished! I'm so sorry!",
      "P-Princess! The giant heart isn't dry yet! Apologies, apologies!",
      "Oh no, you weren't supposed to see this yet! Master's surprise portrait is still wet!",
    ],
    topics: [
      { label: "Can I see the painting?", react: "shake", reply: ["N-no! It's a surprise! Master made me swear on my best brush!"] },
      { label: "You're a wonderful artist", react: "cheer", reply: ["Me?! A masterpiece for the Princess! I'll paint a thousand hearts for you!"] },
      { label: "What colour is that heart?", react: "gasp", reply: ["Rose-red mixed with sunset gold! The exact shade of your smile, Princess."] },
    ],
    farewell: "Back to the brushes! Sorry about the mess, Princess!",
  },
  {
    id: "tam",
    name: "Tam",
    title: "Apprentice",
    look: { id: "tam", skin: "#f2c4a0", hair: "#d9a441", style: "short", top: "#f08a4a", bottom: "#5a4632", acc: "cap", accCol: "#3f7d4a" },
    x: 560,
    y: 650,
    radius: 0,
    behavior: "carry",
    job: "carry",
    route: [
      [560, 650],
      [660, 650],
    ],
    speed: 26,
    voice: 360,
    decorator: true,
    greet: [
      "Whoa! Princess! I-I'm still carrying the last decorations! Sorry, we're not done yet!",
      "P-Princess! Excuse the mess! I'm running late with the gift boxes. Master will be so mad!",
      "Oh! Hi, Princess! Don't peek in the box! Sorry, it's a surprise!",
    ],
    topics: [
      { label: "What's in the box?", react: "shake", reply: ["N-nothing! Just... heart-shaped nothing! Please don't tell Master I almost spilled!"] },
      { label: "Need a hand?", react: "jump", reply: ["No no! I've got it! ...Maybe? Hup! See? Totally fine!"] },
      { label: "You're doing great!", react: "cry", reply: ["Sniff... nobody ever says that to apprentices. Thank you, Princess! I'll work extra hard!"] },
    ],
    farewell: "Gotta run! Sorry, Princess!",
  },
];
