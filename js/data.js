// ===== Aurae Product Data =====
// 纯水晶饰品品类 + 玄学能量文案 + 1688供应商信息

var PRODUCTS = [
  // ==================== 粉晶系列 ====================
  {
    id: "p001",
    name: "Rose Quartz Love Bracelet",
    nameCN: "粉晶爱情手链",
    tagline: "Unconditional Love • Heart Chakra • Emotional Healing",
    price: 39.99,
    compareAt: null,
    category: "bracelet",
    intention: "love",
    crystal: "Rose Quartz",
    crystalCN: "粉晶 / 蔷薇水晶",
    chakra: "Heart Chakra (心轮)",
    element: "Water",
    planet: "Venus",
    image: "/images/p001.png",
    images: ["/images/p001.png", "/images/p001_2.png", "/images/p001_3.png", "/images/p001_4.png", "/images/p001_5.png", "/images/p001_6.png"],
    description: "In the heart of the Earth, where the gentlest waters once flowed, Rose Quartz was born — a crystal so tender it carries the very vibration of love itself. Ancient Egyptians believed Rose Quartz could prevent aging and restore youth, while the Greeks told of Aphrodite's tears turning stone into pink crystal. This bracelet opens your Heart Chakra, dissolves emotional blockages from past wounds, and magnetizes love in all forms — romantic, platonic, and most importantly, self-love. Each bead is hand-strung on durable elastic, ready to wrap your wrist in the frequency of unconditional love.",
    ritual: "Wear on your left wrist to receive love, or your right wrist to project love outward. On a full moon night, place the bracelet under moonlight and set your intention: 'I open my heart to love in all its forms.'",
    properties: [
      "Opens and heals the Heart Chakra",
      "Dissolves emotional blockages and past trauma",
      "Attracts romantic love and deepens existing relationships",
      "Promotes radical self-love and self-acceptance",
      "Calms the nervous system and reduces stress"
    ],
    rating: 4.9,
    reviews: 521,
    stock: 50,
    badge: "Best Seller",
    variants: [
      { name: "Bead Size", options: [
        "6mm (~30 beads)",
        "8mm (~23 beads)",
        "10mm (~19 beads)",
        "12mm (~17 beads)"
      ]}
    ],
    variantPrices: [39.99, 43.99, 47.99, 59.99],
    supplier: {
      platform: "1688",
      shop: "东海县铭泰珠宝有限公司",
      shopUrl: "https://shop1461689671339.1688.com",
      location: "江苏·东海县",
      wholesalePrice: "¥18-25/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "8年老店",
      rating: "好评率99%+"
    }
  },
  {
    id: "p002",
    name: "Strawberry Crystal Attraction Bracelet",
    nameCN: "草莓晶招桃花手链",
    tagline: "Magnetic Charm • Social Grace • Destiny Encounter",
    price: 35.99,
    compareAt: 48.00,
    category: "bracelet",
    intention: "love",
    crystal: "Strawberry Quartz",
    crystalCN: "草莓晶 / 红绿磷铁矿水晶",
    chakra: "Heart Chakra & Root Chakra",
    element: "Fire & Earth",
    planet: "Venus & Mars",
    image: "/images/p002.png",
    images: ["/images/p002.png", "/images/p002_2.png", "/images/p002_3.png", "/images/p002_4.png", "/images/p002_5.png", "/images/p002_6.png"],
    description: "Scattered within the clear depths of Strawberry Quartz are tiny crimson stars — natural iron oxide inclusions that resemble strawberry seeds frozen in crystal time. This rare formation creates a unique energy signature: the grounding warmth of the Earth's iron core combined with the ethereal lightness of quartz. Strawberry Quartz is the crystal of magnetic attraction. It doesn't just draw love — it draws the RIGHT love, aligning your energy field with souls who resonate at your frequency. Wearing this bracelet amplifies your natural charm, enhances social intuition, and creates a subtle but powerful aura of desirability that others feel before they even understand why they're drawn to you.",
    ritual: "Before wearing for the first time, hold the bracelet in both hands and visualize a warm pink light surrounding you. Whisper three times: 'I am a magnet for love, connection, and destined encounters.' Wear on your left wrist during social gatherings or dates.",
    properties: [
      "Magnetizes destined encounters and soul connections",
      "Amplifies personal charisma and social magnetism",
      "Enhances intuition about others' intentions",
      "Grounds romantic energy into practical action",
      "Supports the Root Chakra for stability in relationships"
    ],
    rating: 4.8,
    reviews: 387,
    stock: 40,
    badge: "Hot",
    variants: [
      { name: "Bead Size", options: ["8mm (~23 beads)"] }
    ],
    variantPrices: [35.99],
    supplier: {
      platform: "1688",
      shop: "东海县铭泰珠宝有限公司 (DJ珠宝)",
      shopUrl: "https://shop1461689671339.1688.com",
      location: "江苏·东海县",
      wholesalePrice: "¥25-35/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "8年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 紫水晶系列 ====================
  {
    id: "p003",
    name: "Amethyst Crown of Wisdom Necklace",
    nameCN: "紫水晶智慧之冠项链",
    tagline: "Spiritual Insight • Third Eye • Divine Connection",
    price: 47.99,
    compareAt: 60.00,
    category: "necklace",
    intention: "spirituality",
    crystal: "Amethyst",
    crystalCN: "紫水晶 / 紫晶",
    chakra: "Third Eye & Crown Chakra (眉心轮 & 顶轮)",
    element: "Air & Ether",
    planet: "Jupiter",
    image: "/images/p003.png",
    images: ["/images/p003.png", "/images/p003_2.png", "/images/p003_3.png", "/images/p003_4.png", "/images/p003_5.png", "/images/p003_6.png"],
    description: "Once worth more than gold, Amethyst was the crown jewel of ancient royalty. The word comes from the Greek 'amethystos' — meaning 'not intoxicated,' for the legend of Amethyst, a maiden transformed by Diana to escape Bacchus's wrath, her tears crystallized into purple stone. This necklace features a natural amethyst point pendant, each one unique in its purple gradients — from lavender mist to deep royal violet. Amethyst bridges the Third Eye and Crown Chakras, opening the gateway between earthly awareness and divine wisdom. It quiets the mental chatter, deepens meditation, and allows you to perceive the unseen patterns that govern your life. The sterling silver chain conducts energy purely, making this a talisman of spiritual sovereignty.",
    ritual: "Place the amethyst point on your forehead (Third Eye) during meditation. Visualize a violet light expanding from the crystal into your mind. Set the intention: 'I see beyond the veil. I trust my inner vision.' Wear the necklace so the point rests at your heart to integrate spiritual insights.",
    properties: [
      "Activates Third Eye and Crown Chakras simultaneously",
      "Deepens meditation and enhances intuitive abilities",
      "Calms obsessive thoughts and mental anxiety",
      "Supports sobriety and breaking addictive patterns",
      "Creates a protective spiritual shield around the aura"
    ],
    rating: 4.7,
    reviews: 234,
    stock: 30,
    badge: null,
    variants: [
      { name: "Chain Length", options: ["27in"] }
    ],
    variantPrices: [47.99],
    supplier: {
      platform: "1688",
      shop: "东海县鑫晶顺水晶有限公司 (晶尧)",
      shopUrl: "https://s.1688.com/kq/-B6ABBAA3CFD8CBAEBEA7.html",
      location: "江苏·东海县",
      wholesalePrice: "¥30-45/条",
      moq: "1条起",
      leadTime: "24-48小时发货",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },
  {
    id: "p004",
    name: "Amethyst Serenity Bracelet",
    nameCN: "紫水晶宁静手链",
    tagline: "Deep Calm • Spiritual Protection • Dream Work",
    price: 29.90,
    compareAt: null,
    category: "bracelet",
    intention: "calm",
    crystal: "Amethyst",
    crystalCN: "紫水晶",
    chakra: "Third Eye & Crown Chakra",
    element: "Air",
    planet: "Jupiter",
    image: "/images/p004.png",
    images: ["/images/p004.png", "/images/p004_2.png", "/images/p004_3.png", "/images/p004_4.png", "/images/p004_5.png", "/images/p004_6.png"],
    description: "The violet ray of Amethyst carries the frequency of spiritual tranquility — a calm that doesn't come from suppressing emotions, but from transcending them. When you wear this bracelet, its energy works like a gentle filter, transforming chaotic thoughts into crystalline clarity. Amethyst has been used for millennia by mystics, healers, and dreamers. It activates the higher mind while grounding spiritual awareness into the body, creating a state of 'conscious calm' — alert yet peaceful. Each bead is selected for its natural purple depth, some with subtle chevron patterns that form sacred geometry within the stone.",
    ritual: "Before sleep, hold the bracelet and state your intention for your dreams. Place it under your pillow. In the morning, journal whatever you remember — Amethyst enhances dream recall and spiritual messages received during sleep.",
    properties: [
      "Induces deep, restful sleep and prevents nightmares",
      "Enhances dream recall and lucid dreaming",
      "Creates a spiritual protection field around the body",
      "Transforms anxiety into spiritual surrender",
      "Supports emotional detox and releasing attachments"
    ],
    rating: 4.8,
    reviews: 412,
    stock: 45,
    badge: "Best Seller",
    variants: [
      { name: "Bead Size", options: ["6mm", "8mm", "10mm", "12mm"] }
    ],
    variantPrices: [29.90, 35.90, 42.90, 59.90],
    supplier: {
      platform: "1688",
      shop: "连云港阿朋水晶工艺品有限公司",
      shopUrl: "https://s.1688.com/kq/-CBAEBEA7D4ADB4B4.html",
      location: "江苏·连云港",
      wholesalePrice: "¥15-25/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "6年老店",
      rating: "好评率98%+"
    }
  },

  // ==================== 黑曜石/乌金黑曜石系列 ====================
  {
    id: "p005",
    name: "Black Gold Obsidian Shield Bracelet",
    nameCN: "乌金黑曜石护盾手链",
    tagline: "Energy Armor • Psychic Shield • EMF Deflection",
    price: 23.99,
    compareAt: 39.99,
    category: "bracelet",
    intention: "protection",
    crystal: "Black Gold Obsidian",
    crystalCN: "乌金黑曜石",
    chakra: "Root Chakra (海底轮) & Solar Plexus",
    element: "Earth & Fire",
    planet: "Pluto",
    image: "/images/p005_2.png",
    images: ["/images/p005_2.png", "/images/p005_3.png", "/images/p005_4.png", "/images/p005_5.png", "/images/p005_6.png"],
    description: "Born from volcanic fire and cooled into gleaming black glass, Black Gold Obsidian carries the combined force of Earth's core and the sun's golden ray. Its signature gold sheen appears when light strikes the microscopic mineral inclusions suspended within the volcanic glass — a phenomenon ancient cultures saw as a window into hidden power. Unlike ordinary black obsidian, this golden variety resonates with both the Root Chakra and Solar Plexus, weaving deep grounding with empowered confidence. This bracelet acts as an energetic shield, absorbing negative intentions, environmental stress, and electromagnetic smog while returning your aura to a calm, protected state. For anyone navigating crowded spaces, intense workplaces, or emotionally charged environments, it is essential armor — keeping you centered without carrying others' energy.",
    ritual: "Hold the bracelet in your receiving (non-dominant) hand and tilt it under light until the golden flash appears. Breathe slowly and imagine a sphere of black-gold light expanding from your solar plexus to surround your entire body. Declare: 'I am grounded in my power. I am shielded from all that does not serve me. Only clarity and truth may enter my field.' Wear on your left wrist to absorb protection, right wrist to project confidence and boundaries.",
    properties: [
      "Absorbs and transmutes negative energy, psychic debris, and EMF stress",
      "Grounds scattered energy into the Earth while activating personal power",
      "Reveals hidden truths and supports shadow work with courage",
      "Strengthens energetic boundaries for empaths and sensitive people",
      "Combines deep protection with confidence and willpower"
    ],
    rating: 4.8,
    reviews: 389,
    stock: 45,
    badge: "Best Seller",
    variants: [
      { name: "Bead Size", options: ["6mm", "8mm", "10mm", "12mm", "15mm"] }
    ],
    variantPrices: [23.99, 25.99, 29.99, 32.99, 39.99],
    supplier: {
      platform: "1688",
      shop: "东海县乐天珠宝有限公司 (好美石缘)",
      shopUrl: "https://mip.chinapp.com/company/73229",
      location: "江苏·东海县",
      wholesalePrice: "¥15-22/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },
  {
    id: "p006",
    name: "Black Obsidian Mirror of Truth Pendant",
    nameCN: "黑曜石真理镜吊坠",
    tagline: "Shadow Work • Truth Revelation • Deep Protection",
    price: 35.90,
    compareAt: 55.00,
    category: "pendant",
    intention: "protection",
    crystal: "Black Obsidian",
    crystalCN: "黑曜石 / 阿帕契之泪",
    chakra: "Root Chakra & Earth Star",
    element: "Fire & Earth",
    planet: "Pluto",
    image: "/images/p006_2.png",
    images: ["/images/p006_2.png", "/images/p006_3.png", "/images/p006_4.png", "/images/p006_5.png"],
    description: "Born from volcanic fire that cooled too quickly to crystallize, Obsidian is the Earth's glass — a mirror that reflects without distortion. The Aztecs called it 'teotl' (divine stone) and used Obsidian mirrors for scrying and divination, peering into its depths to see hidden truths and future events. This pendant is your personal mirror of truth. Obsidian doesn't comfort — it reveals. It pulls shadow material from the subconscious, exposes self-deceptions, and cuts through illusions with surgical precision. For those ready to do the deep work of shadow integration, this is the ultimate tool. It also provides the most powerful protective shield of any stone, creating a barrier that negative entities cannot penetrate.",
    ritual: "Sit in a dimly lit room. Hold the pendant at eye level and gaze into its surface. Allow images, feelings, or insights to arise without judgment. When shadow material surfaces, breathe into it and say: 'I see you. I accept you. I integrate you.' Cleanse under running water after each session.",
    properties: [
      "Reveals hidden truths and self-deceptions",
      "Facilitates deep shadow work and subconscious integration",
      "Creates the strongest protective barrier of any crystal",
      "Cuts energetic cords to toxic people and situations",
      "Supports ancestral healing and past-life recall"
    ],
    rating: 4.7,
    reviews: 178,
    stock: 25,
    badge: null,
    variants: [
      { name: "Black Obsidian Mirror of Truth Pendant", options: ["Black Obsidian Mirror of Truth Pendant"] }
    ],
    variantPrices: [35.90],
    supplier: {
      platform: "1688",
      shop: "东海县明轩鸿珠宝有限公司",
      shopUrl: "https://shop1461689671339.1688.com",
      location: "江苏·东海县",
      wholesalePrice: "¥25-35/个",
      moq: "1个起",
      leadTime: "24-48小时发货",
      years: "8年老店",
      rating: "好评率98%+"
    }
  },

  // ==================== 黄水晶/发晶系列 ====================
  {
    id: "p007",
    name: "Citrine Merchant's Ring",
    nameCN: "黄水晶商人之戒",
    tagline: "Wealth Magnet • Solar Power • Abundance Mindset",
    price: 45.99,
    compareAt: 65.00,
    category: "ring",
    intention: "wealth",
    crystal: "Citrine",
    crystalCN: "黄水晶 / 商人之石",
    chakra: "Solar Plexus & Sacral Chakra (太阳轮 & 脐轮)",
    element: "Fire",
    planet: "Sun",
    image: "/images/p007_2.png",
    images: ["/images/p007_2.png", "/images/p007_3.png", "/images/p007_4.png", "/images/p007_5.png", "/images/p007_6.png"],
    description: "Citrine carries the golden fire of the Sun trapped in crystal form. Unlike most crystals that absorb energy, Citrine never needs cleansing because it transmutes — it takes in negativity and radiates it back as golden light. This is why merchants in ancient times kept Citrine in their cash boxes, calling it the 'Merchant's Stone.' It doesn't just attract wealth; it transforms your relationship with abundance. Wearing this ring activates your Solar Plexus — the body's power center — igniting confidence, willpower, and the drive to manifest. The genuine citrine stone, set in adjustable sterling silver, catches light like captured sunshine, reminding you that abundance is your birthright.",
    ritual: "Place the ring in your wallet or cash box overnight to charge it with abundance energy. Before wearing, hold it and visualize golden light filling your body. Affirm: 'I am a conduit for divine abundance. Wealth flows to me effortlessly.' Wear on your index finger (Jupiter) for expansion, or thumb for personal power.",
    properties: [
      "Magnetizes financial abundance and business opportunities",
      "Activates Solar Plexus for confidence and personal power",
      "Transmutes negative energy — never needs cleansing",
      "Transforms scarcity mindset into abundance consciousness",
      "Boosts creativity and motivation for manifestation"
    ],
    rating: 4.6,
    reviews: 156,
    stock: 22,
    badge: null,
    variants: [
      { name: "Size", options: ["Adjustable 6-11"] }
    ],
    variantPrices: [45.99],
    supplier: {
      platform: "1688",
      shop: "东海县悦动珠宝有限公司 (华瑄)",
      shopUrl: "https://mip.chinapp.com/company/72019",
      location: "江苏·东海县",
      wholesalePrice: "¥28-40/个",
      moq: "1个起",
      leadTime: "3-5天定制",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },
  {
    id: "p008",
    name: "Rutilated Quartz Power Bracelet",
    nameCN: "发晶权力手链",
    tagline: "Amplified Manifestation • Prosperity Threads • Will Power",
    price: 35.99,
    compareAt: 89.99,
    category: "bracelet",
    intention: "wealth",
    crystal: "Rutilated Quartz",
    crystalCN: "发晶 / 金发晶 / 钛晶",
    chakra: "Solar Plexus & Crown Chakra",
    element: "Fire & Ether",
    planet: "Sun & Jupiter",
    image: "/images/p008_2.png",
    images: ["/images/p008_2.png", "/images/p008_3.png", "/images/p008_4.png", "/images/p008_5.png", "/images/p008_6.png"],
    description: "Inside clear quartz, golden needles of rutile shoot through like captured lightning — threads of pure energy frozen in time. This is Rutilated Quartz, the most powerful amplifier in the crystal kingdom. The rutile threads act as energetic antennas, broadcasting your intentions into the universe with amplified force while simultaneously drawing abundance back to you. In Chinese crystal lore, golden rutilated quartz is called '发晶' (Fa Jing) — the 'wealth hair crystal' — believed to attract fortune so powerfully that it's the first choice of business owners and entrepreneurs. Each golden thread represents a channel of prosperity; the more threads, the more pathways for wealth to find you.",
    ritual: "Hold the bracelet in sunlight for 10 minutes to supercharge the golden threads. State your specific financial goal aloud — be precise. Wear on your left wrist to receive wealth energy. Touch the beads when making business decisions to amplify your intuition.",
    properties: [
      "Amplifies manifestation intentions with exponential force",
      "Creates multiple channels for wealth and opportunity to flow in",
      "Strengthens willpower and decisive action",
      "Connects Solar Plexus (power) with Crown (divine guidance)",
      "Accelerates the manifestation timeline of your goals"
    ],
    rating: 4.8,
    reviews: 203,
    stock: 28,
    badge: "Hot",
    variants: [
      { name: "Bead Size", options: ["7mm", "8mm", "9mm", "10mm"] }
    ],
    variantPrices: [35.99, 49.99, 57.99, 69.99],
    supplier: {
      platform: "1688",
      shop: "东海县曲阳镇吴景龙水晶商行",
      shopUrl: "https://s.1688.com/kq/-CBAEBEA7D4ADB4B4.html",
      location: "江苏·东海县",
      wholesalePrice: "¥30-50/条",
      moq: "1条起",
      leadTime: "24-48小时发货",
      years: "12年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 虎眼石系列 ====================
  {
    id: "p009",
    name: "Tiger's Eye Warrior Bracelet",
    nameCN: "虎眼石战士手链",
    tagline: "Courage • Will Power • Fear Transmutation",
    price: 23.99,
    compareAt: 35.00,
    category: "bracelet",
    intention: "power",
    crystal: "Tiger's Eye",
    crystalCN: "虎眼石 / 鹰眼石",
    chakra: "Solar Plexus & Sacral Chakra (太阳轮 & 脐轮)",
    element: "Fire & Earth",
    planet: "Sun & Mars",
    image: "/images/p009_2.png",
    images: ["/images/p009_2.png", "/images/p009_3.png", "/images/p009_4.png", "/images/p009_5.png", "/images/p009_6.png"],
    description: "With bands of gold and brown that shimmer and shift as light moves across them, Tiger's Eye earned its name from the hypnotic gaze of the jungle's apex predator. Roman soldiers carried Tiger's Eye into battle, engraved with symbols of courage. This stone carries the frequency of the warrior — not aggression, but the calm, grounded power of one who knows their strength. Tiger's Eye transmutes fear into action, indecision into clarity, and scattered energy into laser focus. It bridges the fiery willpower of the Solar Plexus with the earthy stability of the Root, creating an unshakable foundation for bold moves. For entrepreneurs, leaders, and anyone stepping into a more powerful version of themselves, this is the talisman of transformation.",
    ritual: "When facing a fearful situation, grip the bracelet tightly and feel the stone's warmth. Visualize a tiger standing beside you — powerful, calm, unafraid. Channel that energy. Whisper: 'Fear becomes fuel. I act with the courage of a tiger.'",
    properties: [
      "Transmutes fear and anxiety into grounded courage",
      "Enhances willpower, discipline, and follow-through",
      "Sharpens focus and decision-making under pressure",
      "Balances emotional extremes with earthy stability",
      "Protects during travel and physical challenges"
    ],
    rating: 4.7,
    reviews: 312,
    stock: 40,
    badge: null,
    variants: [
      { name: "Bead Size", options: [
        "6mm (~30 beads)",
        "8mm (~23 beads)",
        "10mm (~19 beads)",
        "12mm (~17 beads)",
        "14mm (~15 beads)"
      ]}
    ],
    variantPrices: [23.99, 29.99, 36.99, 49.99, 69.99],
    supplier: {
      platform: "1688",
      shop: "东阳市御丞电子商务商行",
      shopUrl: "https://s.1688.com/kq/-CBAEBEA7D4ADB4B4.html",
      location: "浙江·东阳",
      wholesalePrice: "¥8-15/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "2年老店",
      rating: "好评率97%+"
    }
  },

  // ==================== 月光石系列 ====================
  {
    id: "p010",
    name: "Moonstone Divine Feminine Pendant",
    nameCN: "月光石女神吊坠",
    tagline: "Intuition • Cycles • Divine Feminine Power",
    price: 45.99,
    compareAt: 58.00,
    category: "pendant",
    intention: "spirituality",
    crystal: "Moonstone",
    crystalCN: "月光石 / 月长石",
    chakra: "Crown & Third Eye Chakra (顶轮 & 眉心轮)",
    element: "Water & Air",
    planet: "Moon",
    image: "/images/p010_2.png",
    images: ["/images/p010_2.png", "/images/p010_3.png", "/images/p010_4.png", "/images/p010_5.png", "/images/p010_6.png"],
    description: "Moonstone holds the captured glow of a full moon — a soft, billowy light that seems to move within the stone as you turn it. Ancient Romans believed Moonstone was formed from frozen moonlight, and in India, it has been sacred for millennia as a stone of divine feminine wisdom. This pendant connects you to the cyclical rhythms of nature — the moon's phases, the tides, the menstrual cycle, the seasons of life. Moonstone enhances intuition to the point of prophecy, balances hormonal fluctuations, and supports women through every life transition — from first menstruation to menopause. For anyone seeking to reconnect with their inner knowing and the deep, intuitive wisdom that modern life often drowns out, this is your talisman.",
    ritual: "Charge under the full moon overnight. Hold the pendant and tune into your body's natural rhythm. Ask: 'What does my body need right now?' Trust the first answer that arises. Wear during the new moon to set intentions, full moon to release.",
    properties: [
      "Enhances intuitive and psychic abilities",
      "Balances hormonal cycles and supports feminine health",
      "Calms emotional turbulence and mood swings",
      "Supports major life transitions (puberty, pregnancy, menopause)",
      "Connects consciousness to lunar and natural cycles"
    ],
    rating: 4.8,
    reviews: 145,
    stock: 25,
    badge: null,
    variants: [
      { name: "Moonstone Divine Feminine Pendant", options: ["Moonstone Divine Feminine Pendant"] }
    ],
    variantPrices: [45.99],
    supplier: {
      platform: "1688",
      shop: "东海县悦动珠宝有限公司 (华瑄)",
      shopUrl: "https://mip.chinapp.com/company/72019",
      location: "江苏·东海县",
      wholesalePrice: "¥25-38/个",
      moq: "1个起",
      leadTime: "3-5天定制",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 拉长石系列 ====================
  {
    id: "p011",
    name: "Labradorite Magic Weaver Bracelet",
    nameCN: "拉长石魔法编织手链",
    tagline: "Transformation • Magic • Aura Protection",
    price: 32.99,
    compareAt: 50.00,
    category: "bracelet",
    intention: "spirituality",
    crystal: "Labradorite",
    crystalCN: "拉长石 / 光谱石",
    chakra: "Throat & Third Eye Chakra (喉轮 & 眉心轮)",
    element: "Air & Water",
    planet: "Mercury & Uranus",
    image: "/images/p011.png",
    images: ["/images/p011.png", "/images/p011_2.png", "/images/p011_3.png", "/images/p011_4.png", "/images/p011_5.png", "/images/p011_6.png"],
    description: "At first glance, Labradorite appears as a plain gray stone. But turn it to the light, and an iridescent flash of electric blue, green, gold, and violet erupts from within — a phenomenon called 'labradorescence.' This is the stone's magic: it reveals its true nature only to those who look deeper. Labradorite is the crystal of transformation and magic. It was discovered when an Inuit warrior struck the stone and saw the Northern Lights trapped inside. Wearing Labradorite shields your aura while simultaneously amplifying your magical and manifesting abilities. It's the crystal for those undergoing deep identity transformation — career changes, spiritual awakenings, or shedding old versions of the self. The flashing colors remind you that what appears ordinary on the surface often holds extraordinary depths.",
    ritual: "Turn the bracelet slowly under different light sources and watch the colors flash. Each flash represents a hidden aspect of yourself waiting to be activated. Set the intention: 'I embrace transformation. I am ready to reveal my magic.'",
    properties: [
      "Facilitates deep identity transformation and spiritual rebirth",
      "Shields the aura while amplifying magical and psychic abilities",
      "Reveals hidden talents and dormant potential",
      "Supports through major life transitions and career changes",
      "Enhances communication with spirit guides and higher self"
    ],
    rating: 4.8,
    reviews: 167,
    stock: 30,
    badge: "New",
    variants: [
      { name: "Bead Size", options: [
        "7mm (~30 beads)",
        "8mm (~23 beads)",
        "9mm (~21 beads)",
        "10mm (~19 beads)"
      ]}
    ],
    variantPrices: [32.99, 39.99, 49.99, 79.99],
    supplier: {
      platform: "1688",
      shop: "东海县铭泰珠宝有限公司 (DJ珠宝)",
      shopUrl: "https://shop1461689671339.1688.com",
      location: "江苏·东海县",
      wholesalePrice: "¥25-35/条",
      moq: "1条起",
      leadTime: "24-48小时发货",
      years: "8年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 绿幽灵系列 ====================
  {
    id: "p012",
    name: "Green Phantom Wealth Bracelet",
    nameCN: "绿幽灵招财手链",
    tagline: "Career Abundance • Growth Energy • Hidden Treasure",
    price: 22.99,
    compareAt: 55.00,
    category: "bracelet",
    intention: "wealth",
    crystal: "Green Phantom Quartz",
    crystalCN: "绿幽灵 / 绿泥石水晶",
    chakra: "Heart & Solar Plexus Chakra (心轮 & 太阳轮)",
    element: "Earth & Wood",
    planet: "Earth & Venus",
    image: "/images/p012.png",
    images: ["/images/p012.png", "/images/p012_2.png", "/images/p012_3.png", "/images/p012_4.png", "/images/p012_5.png", "/images/p012_6.png"],
    description: "Deep within clear quartz, ghostly green pyramids float like ancient forests frozen in crystal amber. These 'phantoms' form when chlorite minerals deposit in layers during the crystal's growth — each phantom marking a chapter in the stone's 100-million-year journey. Green Phantom Quartz is the ultimate career stone in crystal lore. The phantom inclusions represent hidden treasures — wealth that exists but isn't yet visible. Wearing this bracelet aligns you with the energy of growth, expansion, and the slow, inevitable accumulation of abundance. It's particularly powerful for entrepreneurs and career climbers, as each phantom pyramid symbolizes a milestone achieved and a new level of prosperity reached.",
    ritual: "Hold the bracelet up to light and locate the phantom pyramids within each bead. Each one represents a career goal. Touch each phantom while visualizing your next milestone. Wear to job interviews, business meetings, and financial negotiations.",
    properties: [
      "Attracts career advancement and business growth",
      "Reveals hidden opportunities and resources",
      "Supports long-term wealth accumulation (not quick wins)",
      "Aligns heart's desires with practical career action",
      "Grounds ambition in patient, organic growth"
    ],
    rating: 4.6,
    reviews: 198,
    stock: 25,
    badge: null,
    variants: [
      { name: "Bead Size", options: [
        "6mm (~30 beads)",
        "8mm (~23 beads)",
        "10mm (~19 beads)",
        "12mm (~17 beads)"
      ]}
    ],
    variantPrices: [22.99, 29.99, 36.99, 49.99],
    supplier: {
      platform: "1688",
      shop: "东海县悦动珠宝有限公司 (华瑄)",
      shopUrl: "https://mip.chinapp.com/company/72019",
      location: "江苏·东海县",
      wholesalePrice: "¥25-40/条",
      moq: "1条起",
      leadTime: "3-5天定制",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 白水晶系列 ====================
  {
    id: "p013",
    name: "Clear Quartz Master Healer Bracelet",
    nameCN: "白水晶疗愈大师手链",
    tagline: "Amplification • Clarity • Programmable Intention",
    price: 22.99,
    compareAt: 32.00,
    category: "bracelet",
    intention: "wellness",
    crystal: "Clear Quartz",
    crystalCN: "白水晶 / 大师水晶",
    chakra: "All Chakras (全脉轮)",
    element: "All Elements",
    planet: "All Planets",
    image: "/images/p013.png",
    images: ["/images/p013.png", "/images/p013_2.png", "/images/p013_3.png", "/images/p013_4.png", "/images/p013_5.png", "/images/p013_6.png"],
    description: "Clear Quartz is the Grand Master of the crystal kingdom — the only stone that can be programmed with ANY intention. Its perfect hexagonal crystal structure makes it the most efficient energy amplifier on Earth. Aboriginal elders called it 'Maban' — a living stone with consciousness. Clear Quartz works like a crystal singing bowl for your energy field: it clears blockages, amplifies your intentions, and harmonizes all chakras into resonance. Think of it as a blank canvas — whatever energy you imprint into it, it magnifies and radiates back. This is why it pairs with all other crystals, boosting their power. For beginners, this is the essential first crystal; for masters, it remains the most versatile tool in the collection.",
    ritual: "Hold the bracelet between your palms. Breathe deeply and focus on your single most important intention right now. Visualize that intention as a beam of light entering the crystals. The quartz is now programmed. Re-program whenever your intention changes.",
    properties: [
      "Amplifies any intention, energy, or other crystal's properties",
      "Clears and balances all seven chakras simultaneously",
      "Programmable — can be coded with any specific purpose",
      "Enhances clarity of thought and decision-making",
      "Cleanses and charges other crystals placed near it"
    ],
    rating: 4.9,
    reviews: 567,
    stock: 60,
    badge: "Best Seller",
    variants: [
      { name: "Bead Size", options: [
        "7mm (~30 beads)",
        "8mm (~23 beads)",
        "10mm (~19 beads)",
        "12mm (~17 beads)"
      ]}
    ],
    variantPrices: [22.99, 29.99, 36.99, 49.99],
    supplier: {
      platform: "1688",
      shop: "东海县水晶之恋工艺品有限公司",
      shopUrl: "https://www.b2b168.org/wvs214419827.html",
      location: "江苏·东海县",
      wholesalePrice: "¥10-18/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 石榴石系列 ====================
  {
    id: "p014",
    name: "Garnet Phoenix Vitality Bracelet",
    nameCN: "石榴石凤凰活力手链",
    tagline: "Passionate Energy • Blood Vitality • Rebirth From Ashes",
    price: 24.99,
    compareAt: 48.00,
    category: "bracelet",
    intention: "power",
    crystal: "Garnet",
    crystalCN: "石榴石 / 红石榴石",
    chakra: "Root & Sacral Chakra (海底轮 & 脐轮)",
    element: "Fire",
    planet: "Mars & Pluto",
    image: "/images/p014.png",
    images: ["/images/p014.png", "/images/p014_2.png", "/images/p014_3.png", "/images/p014_4.png", "/images/p014_5.png"],
    description: "Garnet glows with the deep red of life force itself — the color of blood, of passion, of the Earth's molten core. Named from 'granatum' (pomegranate seed), this stone has been used since the Bronze Age. Ancient warriors inlaid Garnet into their armor, believing it would stop bleeding and give them the strength to rise again. This is the crystal of the Phoenix — rebirth from destruction. When you feel depleted, burned out, or disconnected from your passion for life, Garnet reignites the inner flame. It stimulates the Root and Sacral Chakras, grounding raw vital energy into the body, boosting circulation, and awakening dormant creative and sexual energy. For those emerging from a period of darkness, Garnet provides the fuel to rebuild.",
    ritual: "When feeling depleted, hold the bracelet against your lower back (sacral area) and breathe deeply. Visualize a red flame growing from your pelvis, spreading warmth through your entire body. Affirm: 'I rise renewed. My fire burns eternal.'",
    properties: [
      "Restores depleted energy and combats burnout",
      "Stimulates blood circulation and cellular regeneration",
      "Awakens creative and sexual passion",
      "Grounds spiritual energy into physical embodiment",
      "Supports recovery from illness, grief, or emotional devastation"
    ],
    rating: 4.7,
    reviews: 234,
    stock: 35,
    badge: null,
    variants: [
      { name: "Bead Size", options: [
        "5mm (~35 beads)",
        "7mm (~25 beads)",
        "9mm (~20 beads)",
        "11mm (~18 beads)"
      ]}
    ],
    variantPrices: [24.99, 31.99, 36.99, 49.99],
    supplier: {
      platform: "1688",
      shop: "东海县乐天珠宝有限公司 (好美石缘)",
      shopUrl: "https://mip.chinapp.com/company/73229",
      location: "江苏·东海县",
      wholesalePrice: "¥18-28/条",
      moq: "1条起",
      leadTime: "24小时发货",
      years: "10年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 海蓝宝系列 ====================
  {
    id: "p015",
    name: "Aquamarine Ocean Calm Necklace",
    nameCN: "海蓝宝海洋平静项链",
    tagline: "Serene Communication • Emotional Flow • Inner Peace",
    price: 69.99,
    compareAt: 68.00,
    category: "necklace",
    intention: "calm",
    crystal: "Aquamarine",
    crystalCN: "海蓝宝 / 海水蓝宝石",
    chakra: "Throat Chakra (喉轮)",
    element: "Water",
    planet: "Moon & Neptune",
    image: "/images/p015.png",
    images: ["/images/p015.png", "/images/p015_2.png", "/images/p015_3.png", "/images/p015_4.png", "/images/p015_5.png", "/images/p015_6.png"],
    description: "Aquamarine carries the essence of the ocean in solid form — its blue-green hues shift like sunlight through shallow waters. Sailors carried Aquamarine as a talisman against drowning, believing it was the treasure of mermaids. This stone resonates with the Throat Chakra, the center of authentic expression. It dissolves the fear of speaking your truth, soothes throat tension, and gives your words the calming flow of ocean waves. For those who swallow their feelings, who stay silent when they should speak, or who struggle with communication in relationships, Aquamarine gently teaches the art of fluid, honest expression. Its cooling energy also calms hot tempers and reduces inflammation — physically and emotionally.",
    ritual: "Dip the necklace in clean water (or hold under running water) to activate its ocean energy. Place it against your throat and hum softly until you feel vibration in the stone. Ask: 'What truth am I ready to speak?' Wear when you need to have difficult conversations.",
    properties: [
      "Activates Throat Chakra for authentic communication",
      "Dissolves fear of public speaking and self-expression",
      "Calms anger, irritability, and inflammatory responses",
      "Supports thyroid health and throat healing",
      "Creates emotional fluidity — feelings flow instead of stagnating"
    ],
    rating: 4.7,
    reviews: 189,
    stock: 20,
    badge: null,
    variants: [
      { name: "Aquamarine Ocean Calm Necklace", options: ["Aquamarine Ocean Calm Necklace"] }
    ],
    variantPrices: [69.99],
    supplier: {
      platform: "1688",
      shop: "东海县牛山鑫创水晶商行",
      shopUrl: "https://s.1688.com/kq/-B6ABBAA3CFD8CBAEBEA7.html",
      location: "江苏·东海县",
      wholesalePrice: "¥25-40/条",
      moq: "1条起",
      leadTime: "24-48小时发货",
      years: "12年老店",
      rating: "好评率99%+"
    }
  },

  // ==================== 青金石系列 ====================
  {
    id: "p016",
    name: "Lapis Lazuli Royal Phoenix Tassel Earrings",
    nameCN: "青金石皇家凤凰流苏耳环",
    tagline: "Truth • Royal Wisdom • Inner Vision",
    price: 59.99,
    compareAt: 55.00,
    category: "earring",
    intention: "spirituality",
    crystal: "Lapis Lazuli",
    crystalCN: "青金石 / 帝王之石",
    chakra: "Third Eye & Throat Chakra (眉心轮 & 喉轮)",
    element: "Air & Spirit",
    planet: "Jupiter & Venus",
    image: "/images/p016_2.png",
    images: ["/images/p016_2.png", "/images/p016_3.png", "/images/p016_4.png", "/images/p016_5.png", "/images/p016_6.png"],
    description: "Lapis Lazuli — the stone of kings, queens, and gods. Its deep celestial blue, speckled with golden pyrite like stars in the night sky, made it the most prized gemstone of ancient civilizations. Cleopatra ground Lapis into powder for her iconic eyeshadow. Michelangelo used it for the blue in the Sistine Chapel. The Pharaohs were buried with Lapis scarabs to guide them through the underworld. This is a stone of total truth — it activates both the Third Eye (to SEE truth) and the Throat (to SPEAK truth) simultaneously. Wearing Lapis Lazuli earrings places the stone near both your mind and your voice, creating a continuous circuit of wisdom: you perceive clearly, and you express what you perceive with royal confidence. The golden flecks within remind you that your inner wisdom is worth more than gold.",
    ritual: "Before important conversations or decisions, touch each earring and visualize blue light activating your Third Eye and Throat. Affirm: 'I see clearly. I speak truly. I am a vessel of divine wisdom.'",
    properties: [
      "Activates Third Eye and Throat Chakras for vision + expression",
      "Enhances intellectual analysis and problem-solving",
      "Promotes radical honesty with self and others",
      "Connects to ancient wisdom and past-life knowledge",
      "Supports leadership and confident self-expression"
    ],
    rating: 4.8,
    reviews: 112,
    stock: 18,
    badge: "New",
    variants: [
      { name: "Lapis Lazuli Royal Phoenix Tassel Earrings", options: ["Lapis Lazuli Royal Phoenix Tassel Earrings"] }
    ],
    variantPrices: [59.99],
    supplier: {
      platform: "1688",
      shop: "东海县名之都水晶制品有限公司 (名都水晶)",
      shopUrl: "https://s.1688.com/kq/-B6ABBAA3CFD8CBAEBEA7.html",
      location: "江苏·东海县",
      wholesalePrice: "¥20-35/对",
      moq: "1对起",
      leadTime: "24-48小时发货",
      years: "12年老店",
      rating: "好评率99%+"
    }
  }
];

// ===== Intention Categories =====
const INTENTIONS = [
  { id: "wellness", name: "Wellness", icon: "🌿", color: "#7BB661", desc: "Support your physical and emotional wellbeing" },
  { id: "wealth", name: "Wealth", icon: "💰", color: "#D4A537", desc: "Manifest abundance and prosperity" },
  { id: "protection", name: "Protection", icon: "🛡️", color: "#3D3D3D", desc: "Shield your energy from negativity" },
  { id: "calm", name: "Calm", icon: "🌊", color: "#6DAEDB", desc: "Find peace and inner balance" },
  { id: "love", name: "Love", icon: "💖", color: "#E8829B", desc: "Open your heart to all forms of love" },
  { id: "spirituality", name: "Spirituality", icon: "🔮", color: "#8B5CF6", desc: "Deepen your spiritual connection" },
  { id: "fresh-start", name: "Fresh Start", icon: "🌱", color: "#5BA88E", desc: "Embrace new beginnings" },
  { id: "power", name: "Power", icon: "⚡", color: "#E8590C", desc: "Step into your personal power" }
];

// ===== Product Categories =====
const CATEGORIES = [
  { id: "bracelet", name: "Bracelets", desc: "Crystal beaded bracelets for every intention" },
  { id: "necklace", name: "Necklaces", desc: "Crystal point & pendant necklaces" },
  { id: "pendant", name: "Pendants", desc: "Powerful crystal pendants & talismans" },
  { id: "ring", name: "Rings", desc: "Crystal rings for daily intention" },
  { id: "earring", name: "Earrings", desc: "Crystal earrings for wisdom & beauty" }
];

// ===== Energy Profile Quiz Questions =====
const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What brings you here today?",
    subtitle: "Trust your first instinct — your soul already knows the answer.",
    options: [
      { label: "I feel stuck and need a breakthrough", value: { power: 3, "fresh-start": 2 }, icon: "⚡" },
      { label: "I'm seeking love or deeper connection", value: { love: 3, calm: 1 }, icon: "💖" },
      { label: "I need protection from negative energy", value: { protection: 3, calm: 1 }, icon: "🛡️" },
      { label: "I want to attract wealth and abundance", value: { wealth: 3, power: 1 }, icon: "💰" }
    ]
  },
  {
    id: "q2",
    question: "How would you describe your current energy state?",
    subtitle: "There's no wrong answer — awareness is the first step to alignment.",
    options: [
      { label: "Anxious, scattered, overthinking", value: { calm: 3, spirituality: 1 }, icon: "🌪️" },
      { label: "Drained, exhausted, depleted", value: { wellness: 3, power: 1 }, icon: "🥀" },
      { label: "Restless, impatient, seeking change", value: { power: 2, "fresh-start": 2 }, icon: "🔥" },
      { label: "Disconnected, lost, seeking purpose", value: { spirituality: 3, love: 1 }, icon: "🌫️" }
    ]
  },
  {
    id: "q3",
    question: "Which scenario resonates most with your life right now?",
    subtitle: "Choose the one that makes your heart react — not your mind.",
    options: [
      { label: "I absorb others' emotions and feel drained in crowds", value: { protection: 3, calm: 1 }, icon: "🫧" },
      { label: "I have big dreams but struggle to take action", value: { power: 2, wealth: 1, "fresh-start": 1 }, icon: "🏔️" },
      { label: "Past wounds keep me from opening my heart", value: { love: 3, spirituality: 1 }, icon: "💔" },
      { label: "I sense there's more to life but can't see the path", value: { spirituality: 2, "fresh-start": 2 }, icon: "🌌" }
    ]
  },
  {
    id: "q4",
    question: "When you close your eyes and imagine your ideal state, what do you see?",
    subtitle: "Your imagination is the language of your higher self. Listen to it.",
    options: [
      { label: "Standing strong, radiating confidence and power", value: { power: 3 }, icon: "👑" },
      { label: "Surrounded by love, warm and deeply connected", value: { love: 3 }, icon: "🤗" },
      { label: "Peaceful, clear, floating in serene stillness", value: { calm: 3, spirituality: 1 }, icon: "🧘" },
      { label: "Abundant, flowing, everything I need arrives", value: { wealth: 3, "fresh-start": 1 }, icon: "✨" }
    ]
  },
  {
    id: "q5",
    question: "Which element calls to you most?",
    subtitle: "Your elemental affinity reveals the energy you most need to cultivate.",
    options: [
      { label: "Fire — passion, transformation, action", value: { power: 2, wealth: 1 }, icon: "🔥" },
      { label: "Water — emotion, intuition, flow", value: { love: 2, calm: 1, spirituality: 1 }, icon: "💧" },
      { label: "Earth — stability, protection, grounding", value: { protection: 2, wealth: 1 }, icon: "🌍" },
      { label: "Air — clarity, wisdom, new beginnings", value: { spirituality: 2, "fresh-start": 1, calm: 1 }, icon: "🌬️" }
    ]
  },
  {
    id: "q6",
    question: "What is your heart's deepest desire right now?",
    subtitle: "Be honest with yourself. This is between you and the universe.",
    options: [
      { label: "To feel safe, protected, and grounded", value: { protection: 3, wellness: 1 }, icon: "🏔️" },
      { label: "To love and be loved completely", value: { love: 3 }, icon: "💗" },
      { label: "To understand my purpose and spiritual path", value: { spirituality: 3 }, icon: "🔮" },
      { label: "To break free and start fresh", value: { "fresh-start": 3, power: 1 }, icon: "🦋" }
    ]
  }
];

// Blog posts
const BLOG_POSTS = [
  {
    id: "b1",
    category: "beginners",
    readTime: "14 min read",
    title: "Healing Crystals: A Guide for Beginners",
    excerpt: "When you are just starting to work with the energy of crystals, it can all feel quite overwhelming. This guide will walk you through everything you need to know...",
    image: "/images/p013.png",
    content: `<p>Crystals are more than beautiful stones. They are energetic allies, formed over millions of years under immense pressure, each carrying a unique vibration. If you are new to the world of crystal healing, welcome. This guide is your gentle introduction.</p>
      <h3>What Is Crystal Healing?</h3>
      <p>Crystal healing is the practice of using stones to support balance in the body, mind, and spirit. Every crystal has a specific energetic signature. Clear Quartz amplifies intention, Rose Quartz opens the heart, and Black Gold Obsidian creates a protective shield. When you bring a crystal into your field, you invite its frequency to interact with your own.</p>
      <h3>How to Choose Your First Crystal</h3>
      <p>There are two ways: logic and intuition. Logic means selecting a crystal based on the energy you need — Amethyst for calm, Citrine for abundance, Obsidian for grounding. Intuition means letting a stone call to you. Often, the crystal you are most drawn to is the one holding the energy your soul needs right now.</p>
      <h3>Cleansing & Charging</h3>
      <p>Once you receive your crystal, cleanse it. Smoke, moonlight, sound, or a bowl of salt water all work. Then set an intention. Hold the stone, speak your desire, and feel the vibration lock in. Your crystal is now ready to support you.</p>`
  },
  {
    id: "b2",
    category: "crystals",
    readTime: "16 min read",
    title: "8 Crystals for Money, Wealth & Prosperity & How to Use Them",
    excerpt: "Everyone's been given safe, sensible financial advice at some point. But what if the key to abundance was something you could hold in your hand?",
    image: "/images/p008_2.png",
    content: `<p>Abundance is not just about money. It is about flow, confidence, opportunity, and the willingness to receive. These eight crystals are known for their wealth-attracting energies and have been used by merchants, healers, and manifestors for centuries.</p>
      <h3>1. Citrine — The Merchant's Stone</h3>
      <p>Bright, golden Citrine carries the energy of the sun and prosperity. Keep a Citrine ring on your dominant hand or place a cluster in the wealth corner of your home to invite financial flow.</p>
      <h3>2. Pyrite — Fool's Gold, Real Power</h3>
      <p>Pyrite reflects ambition and discipline. It helps you turn ideas into action. Place it on your desk to fuel focus and strategic thinking.</p>
      <h3>3. Green Aventurine — Luck Magnet</h3>
      <p>Known as the stone of opportunity, Green Aventurine attracts luck and expansion. Carry it before meetings, interviews, or financial decisions.</p>
      <h3>4. Tiger's Eye — Confidence & Clarity</h3>
      <p>Tiger's Eye blends grounding earth energy with sharp mental focus. It helps you make confident financial choices without fear.</p>
      <h3>5. Jade — Long-Term Wealth</h3>
      <p>In many cultures, Jade symbolizes sustained prosperity and protection. Wear it as a bracelet to keep wealth energy close to your pulse.</p>
      <h3>6. Malachite — Transformation</h3>
      <p>Malachite supports deep transformation. It helps release limiting beliefs about money and opens you to new income paths.</p>
      <h3>7. Clear Quartz — Amplifier</h3>
      <p>Pair Clear Quartz with any abundance stone to magnify its intention. It acts like an energetic microphone for your goals.</p>
      <h3>8. Green Ghost Crystal — Growth Energy</h3>
      <p>Green Phantom Quartz, with its ghostly internal gardens, supports business growth and the manifestation of long-term wealth.</p>`
  },
  {
    id: "b3",
    category: "jewelry",
    readTime: "5 min read",
    title: "Power Banding 101: Where to Wear Your Crystal Bracelets",
    excerpt: "Not that you need another reason to deck yourself out in crystal jewelry, but in case you want to maximize their energy benefits...",
    image: "/images/p001.png",
    content: `<p>Your crystal bracelet is more than an accessory. It is a portable energy field. But did you know that where you wear it changes how its energy flows through you?</p>
      <h3>Left Wrist: Receiving Energy</h3>
      <p>The left side of the body is traditionally associated with receiving. Wear Rose Quartz, Moonstone, or Amethyst on your left wrist to invite love, intuition, peace, and healing into your energy field.</p>
      <h3>Right Wrist: Projecting Energy</h3>
      <p>The right side is your giving or projecting side. Wear Citrine, Tiger's Eye, or Black Gold Obsidian on your right wrist to send confidence, protection, and abundance out into the world.</p>
      <h3>Layering with Intention</h3>
      <p>Stacking bracelets is beautiful, but do it with purpose. Pair a grounding stone with an amplifying stone, or combine heart-centered energy with protective energy. Let each stack tell an intentional story.</p>
      <h3>When to Take It Off</h3>
      <p>Remove crystal jewelry before sleeping if you are highly sensitive, before swimming in salt or chlorine, and during activities where the stones could be damaged. Treat your crystals with respect, and they will serve you for years.</p>`
  },
  {
    id: "b4",
    category: "guides",
    readTime: "14 min read",
    title: "A Room-by-Room Guide to Using Crystals for the Home",
    excerpt: "Home base may be a term that comes from baseball, but it perfectly describes how your home should feel — safe, grounding, and yours...",
    image: "/images/p005_2.png",
    content: `<p>Your home is your sanctuary. When you place crystals intentionally in each room, you turn your living space into an active energetic support system. Here is how to align your home with crystal energy.</p>
      <h3>Entryway: Protection & Welcome</h3>
      <p>The entryway is where outside energy enters your home. Place Black Gold Obsidian or Obsidian near the door to absorb negativity and create a protective boundary. Add Rose Quartz nearby to ensure what enters feels loving and soft.</p>
      <h3>Living Room: Connection & Calm</h3>
      <p>This is the heart of social energy. Amethyst clusters encourage calm conversation, while Selenite keeps the space energetically clear and peaceful.</p>
      <h3>Bedroom: Rest & Romance</h3>
      <p>Keep the bedroom a low-stimulation energy zone. Rose Quartz on the nightstand supports love and emotional healing, while Moonstone invites restful, intuitive dreams. Avoid overly activating stones like Citrine here.</p>
      <h3>Home Office: Focus & Abundance</h3>
      <p>Your workspace benefits from mental clarity and ambition. Citrine, Pyrite, and Tiger's Eye make a powerful trio for focus, confidence, and financial momentum.</p>
      <h3>Kitchen: Nourishment & Vitality</h3>
      <p>Citrine and Carnelian bring warm, energizing vibrations to the kitchen, the room where the body is literally nourished.</p>
      <h3>Bathroom: Cleansing & Release</h3>
      <p>The bathroom is a space of release. Place Clear Quartz or Amethyst here to support energetic cleansing and spiritual renewal during baths.</p>`
  },
  {
    id: "b5",
    category: "guides",
    readTime: "12 min read",
    title: "How to Spot Fake vs. Real Crystals: A Buyer's Guide",
    excerpt: "The crystal market is beautiful — and crowded with fakes. Learn the simple tests that separate genuine stones from glass, dye, and resin.",
    image: "/images/p013.png",
    content: `<p>As crystals have gone mainstream, so have counterfeits. Glass, dyed quartz, and resin imitations now fill many marketplaces. The good news: with a few simple checks, you can protect yourself and buy with confidence.</p>
      <h3>1. The Temperature Test</h3>
      <p>Real crystals feel cool to the touch and stay cool longer than glass. Hold the stone in your palm for thirty seconds. Glass warms almost immediately; a genuine quartz or amethyst will still feel slightly cool.</p>
      <h3>2. Look for Imperfection</h3>
      <p>Nature is not uniform. Genuine stones show tiny inclusions, uneven color, and natural striations. A stone that is perfectly clear, perfectly uniform, and suspiciously flawless is often glass or synthetic.</p>
      <h3>3. The Bubble Check</h3>
      <p>Hold the stone up to bright light. Air bubbles trapped inside are a tell-tale sign of glass. Real crystal may have mineral inclusions that look like wisps or feathers — never round bubbles.</p>
      <h3>4. Weight & Density</h3>
      <p>Crystals are denser than they look. A "stone" that feels oddly light for its size may be resin or plastic. Compare two similar-sized pieces; the heavier one is usually real.</p>
      <h3>5. Watch the Price</h3>
      <p>If a large, vividly colored "rare" crystal costs next to nothing, be skeptical. Genuine rarity carries a price. Deeply discounted "Citrine" points or neon-bright stones are frequently heat-treated or dyed.</p>
      <h3>6. Ask for Provenance</h3>
      <p>Reputable sellers share where a stone was mined and will stand behind authenticity. At Aurae, every piece is sourced from known mines and inspected before it reaches you. When in doubt, buy from sellers who do the same.</p>`
  },
  {
    id: "b6",
    category: "spirituality",
    readTime: "10 min read",
    title: "Crystal Meditation for Beginners: A Step-by-Step Ritual",
    excerpt: "You don't need to be a mystic to meditate with crystals. Here is a simple, grounding ritual you can do in ten quiet minutes.",
    image: "/images/p004.png",
    content: `<p>Meditation can feel intimidating when you are starting out. Crystals give your wandering mind a gentle anchor. This ten-minute ritual is perfect for beginners and requires only one stone and a few minutes of quiet.</p>
      <h3>Step 1: Choose Your Stone</h3>
      <p>Start with one crystal. Amethyst is ideal for calm and focus, Rose Quartz for heart-opening, Clear Quartz for clarity. Pick the stone whose energy you are most curious about today.</p>
      <h3>Step 2: Cleanse</h3>
      <p>Hold your stone and imagine any stagnant energy rinsing away. A quick pass through incense smoke or a moment under running water is enough. You are resetting the stone to a clean, neutral state.</p>
      <h3>Step 3: Set an Intention</h3>
      <p>Before you begin, name what you need. "I welcome calm." "I release what is not mine." Speak it silently or aloud. Your intention is the lens that focuses the stone's energy.</p>
      <h3>Step 4: Find a Position</h3>
      <p>Sit comfortably with your spine tall. Rest the crystal in your open palm or place it just below your navel. Let your shoulders soften and your jaw unclench.</p>
      <h3>Step 5: Breathe & Visualize</h3>
      <p>Inhale for four counts, exhale for six. With each breath, imagine a soft light moving from the crystal into your body — cool, steady, supportive. When your mind drifts, gently return to the sensation of the stone.</p>
      <h3>Step 6: Close</h3>
      <p>After ten minutes, thank the stone and the moment. Keep your intention in mind as you return to your day. With regular practice, even two minutes can reset your entire energy.</p>`
  },
  {
    id: "b7",
    category: "guides",
    readTime: "9 min read",
    title: "The Ultimate Crystal Gift Guide: What to Give & When",
    excerpt: "A crystal is more than a gift — it is a wish for someone's wellbeing. Here is what to give for every occasion that matters.",
    image: "/images/p001.png",
    content: `<p>Few gifts carry as much intention as a crystal. Whether you believe in their energy or simply love their beauty, giving a stone is a quiet way of saying "I wish you well." Here is a quick guide for the moments that matter.</p>
      <h3>For Love & Anniversaries</h3>
      <p>Rose Quartz is the unmistakable stone of love. A Rose Quartz bracelet is a daily reminder of affection, while a Moonstone pendant celebrates intuition and devotion. Give it to a partner, a new spouse, or yourself.</p>
      <h3>For a New Job or Promotion</h3>
      <p>Citrine and Tiger's Eye project confidence and momentum. A Citrine ring or Tiger's Eye bracelet makes a thoughtful "go get them" gift for anyone stepping into new responsibility.</p>
      <h3>For Graduation</h3>
      <p>Clear Quartz amplifies focus and clarity — perfect for a student beginning a new chapter. Pair it with Amethyst to support calm focus through the next big transition.</p>
      <h3>For Healing & Hard Times</h3>
      <p>Black Gold Obsidian and Amethyst offer grounding and comfort. A protective bracelet tells someone "I've got you" without saying a word, especially during loss or burnout.</p>
      <h3>For a New Baby or Home</h3>
      <p>Soft, gentle stones like Rose Quartz or Moonstone bless a nursery or a new house with warmth. Keep them on a shelf where they can quietly hold good energy for the whole family.</p>
      <h3>For Self-Love</h3>
      <p>Sometimes the most important recipient is you. Choose the stone you are drawn to, not the one you think you should want. That pull is often exactly the energy you need.</p>`
  },
  {
    id: "b8",
    category: "guides",
    readTime: "11 min read",
    title: "Crystal Care 101: How to Cleanse, Charge & Store Your Stones",
    excerpt: "Your crystals work quietly to hold and shift energy — so they deserve care too. Learn the gentle, effective ways to cleanse, charge, and store every stone in your collection.",
    image: "/images/p013.png",
    content: `<p>A crystal is not a static decoration. In the traditions that surround it, every stone is a living carrier of energy — absorbing what you release, holding what you ask it to, and slowly taking on the residue of the rooms and moods it passes through. That is exactly why care matters. A well-tended stone stays clear, bright, and ready to support you. A neglected one simply goes dull.</p>
      <h3>Why Crystals Need Cleansing</h3>
      <p>Cleansing is the practice of clearing stagnant or absorbed energy so the stone returns to a neutral, receptive state. Think of it like washing your hands: not because the stone is "dirty," but because you want a clean slate before the next intention. A good rule of thumb is to cleanse a stone when it first arrives, after any intense emotional moment, and roughly once a month as routine maintenance.</p>
      <h3>5 Gentle Ways to Cleanse</h3>
      <p><strong>1. Smoke.</strong> Pass the stone through the smoke of sage, palo santo, or incense for twenty to thirty seconds while setting the intention to clear it. This works for every stone, including delicate ones.</p>
      <p><strong>2. Moonlight.</strong> Leave your crystals on a windowsill overnight during the full moon. Moonlight is soft and safe for all stones — and a beautiful monthly ritual.</p>
      <p><strong>3. Sound.</strong> A singing bowl, tuning fork, or even a gentle bell can reset a stone's frequency. Sound is ideal for jewelry you do not want to get wet.</p>
      <p><strong>4. Running Water.</strong> Hold hard stones (quartz, amethyst, citrine) under cool running water for a minute. Skip this for soft or porous stones like selenite, calcite, or raw pyrite, which can dissolve or rust.</p>
      <p><strong>5. Earth & Selenite.</strong> Bury a stone in clean soil for a day, or rest it on a Selenite plate. Selenite is self-cleansing and gently clears whatever sits near it.</p>
      <h3>How to Charge & Set Intention</h3>
      <p>Cleansing empties the stone; charging fills it. After cleansing, hold the stone in sunlight for an hour (again, avoid prolonged sun for color-sensitive stones like amethyst and rose quartz), or simply cup it in your hands. Speak or think a clear intention — "I welcome calm," "I protect my peace" — and let the words land. The stone is now yours again, pointed at what you need.</p>
      <h3>Storing Stones Without Damage</h3>
      <p>Keep hard stones apart from soft ones so nothing scratches. Small pouches or a divided jewelry box work perfectly. Store color-sensitive stones like amethyst and rose quartz away from direct sunlight to prevent fading, and keep raw or fragile pieces in padded compartments. Jewelry should be removed before swimming, showering, or sleeping.</p>
      <h3>A Simple Weekly Ritual</h3>
      <p>You do not need elaborate ceremony. Once a week, wipe your stones with a soft cloth, pass them through a little smoke or moonlight, and reset one intention. Ten quiet minutes is enough to keep your whole collection bright, clear, and working with you.</p>`
  },
  {
    id: "b9",
    category: "crystals",
    readTime: "10 min read",
    title: "Crystal Pairings: The Best Stone Combinations for Love, Protection & Abundance",
    excerpt: "Some crystals shine on their own — but paired with the right companion, they tell a stronger story. Discover the combinations that amplify love, shield your energy, and draw in abundance.",
    image: "/images/p001.png",
    content: `<p>Working with one crystal is a wonderful start. But just as people bring out different sides of each other, stones combine to build a richer, more layered energy. The art of pairing is simply matching intentions so two stones pull in the same direction. Here are the combinations our community reaches for most.</p>
      <h3>For Love & the Open Heart</h3>
      <p><strong>Rose Quartz + Rhodonite.</strong> Rose Quartz opens the heart; Rhodonite soothes the old wounds that keep it closed. Together they support both new love and self-forgiveness.</p>
      <p><strong>Rose Quartz + Green Aventurine.</strong> Add Green Aventurine to invite not just love, but the luck and confidence to meet it. A gentle pairing for dating, healing, and fresh starts.</p>
      <h3>For Protection & Grounding</h3>
      <p><strong>Black Obsidian + Hematite.</strong> Obsidian pulls in and absorbs negativity; Hematite roots you firmly to the earth. Wear this duo when you feel scattered or under strain.</p>
      <p><strong>Black Tourmaline + Smoky Quartz.</strong> Two of the most protective stones in the mineral world. This is the combination to keep by the door or on your desk for a calm, shielded space.</p>
      <h3>For Abundance & Focus</h3>
      <p><strong>Citrine + Pyrite.</strong> Citrine is the merchant's stone of wealth; Pyrite turns ideas into disciplined action. Placed together on a workspace, they are a quiet engine for momentum.</p>
      <p><strong>Citrine + Green Aventurine.</strong> Citrine draws money; Green Aventurine draws opportunity. A classic manifestation pairing for new ventures.</p>
      <h3>For Calm & Clarity</h3>
      <p><strong>Amethyst + Clear Quartz.</strong> Amethyst slows a racing mind; Clear Quartz amplifies whatever it touches. One clears, the other focuses — a perfect study or sleep companion.</p>
      <p><strong>Lepidolite + Amethyst.</strong> Both carry soothing, lithium-rich energy. This is the stack to reach for during anxiety or restless nights.</p>
      <h3>For Energy & Confidence</h3>
      <p><strong>Tiger's Eye + Carnelian.</strong> Tiger's Eye brings steady focus; Carnelian brings warm, courageous drive. Wear them when you need to be seen and heard.</p>
      <h3>How to Combine Without Clashing</h3>
      <p>Start with one clear intention, then pick stones that serve it. Balance grounding with uplifting, and avoid wearing six competing stones at once — too many frequencies at once can feel noisy rather than supportive. When in doubt, let your intuition choose; the combination you are drawn to is usually the one your energy needs right now.</p>`
  },
  {
    id: "b10",
    category: "spirituality",
    readTime: "12 min read",
    title: "Crystals for Sleep, Anxiety & Calm: A Practical Nighttime Ritual",
    excerpt: "If your mind races the moment your head hits the pillow, you are not alone. These calming crystals and a simple 10-minute nighttime ritual can help you wind down, release the day, and finally rest.",
    image: "/images/p007_2.png",
    content: `<p>There is a particular kind of tired that sleep does not touch. The kind where you climb into bed, the lights go off, and suddenly your brain decides now is the perfect time to replay every awkward moment from 2009 and list everything you forgot to do tomorrow. If that sounds familiar, you are in good company — and crystals can be a surprisingly gentle ally in quieting the noise.</p>
      <h3>Why Crystals for Sleep & Anxiety?</h3>
      <p>Nobody is claiming a stone is a substitute for rest, therapy, or a good mattress. But crystals work on the level of ritual and attention. The simple act of choosing a stone, holding it, and setting the intention to slow down signals your nervous system that it is safe to power down. The stone becomes an anchor for the evening — a physical reminder that the day is done.</p>
      <h3>The Calm Crew: Best Crystals for Rest</h3>
      <p><strong>Amethyst — the classic sleep stone.</strong> Soft purple Amethyst has long been associated with calm and quiet sleep. Keep a small cluster on the nightstand or tuck a tumbled piece under your pillow. Many people find its gentle energy takes the edge off a racing mind.</p>
      <p><strong>Lepidolite — the lithium stone.</strong> Lepidolite naturally contains lithium, the same mineral used in many calming supplements. It carries one of the most soothing frequencies in the crystal world and is a favorite for anxiety and restlessness.</p>
      <p><strong>Howlite — the overthink stone.</strong> White-and-grey Howlite is beloved by people who spiral into endless analysis at bedtime. It is said to slow the chatter and invite patience and stillness.</p>
      <p><strong>Moonstone — the dream stone.</strong> Moonstone connects to the cycles of the moon and the softer, intuitive side of the mind. It is wonderful for restful, meaningful dreams rather than jittery, half-waking sleep.</p>
      <p><strong>Rose Quartz — the comfort stone.</strong> If nighttime anxiety comes from loneliness or heart-heaviness, Rose Quartz offers a warm, held feeling. Keep it close when the dark feels too big.</p>
      <h3>A Simple Nighttime Ritual (10 Minutes)</h3>
      <p><strong>1. Pick one stone.</strong> Choose the crystal your intuition reaches for. One is enough — you are building a habit, not a collection on the nightstand.</p>
      <p><strong>2. Cleanse it.</strong> A quick pass through incense smoke or a moment under moonlight resets the stone. No elaborate ceremony required.</p>
      <p><strong>3. Set an intention.</strong> Hold the stone and quietly name what you need: "I release today." "I let my body rest." The words give the stone a direction.</p>
      <p><strong>4. Place it.</strong> Tuck it under your pillow, rest it on the nightstand, or hold it in your palm as you lie down. Let its presence be the last thing you notice before sleep.</p>
      <p><strong>5. Breathe.</strong> Inhale for four, exhale for six. Each slow breath tells your body the day is over. When the mind drifts back to its to-do list, return to the stone and the breath.</p>
      <h3>What to Avoid at Night</h3>
      <p>Not every crystal belongs in the bedroom. Bright, activating stones like Citrine and Tiger's Eye are wonderful for mornings and work — but at night they can keep the engine running. Save those for your desk, and let the calm crew take the night shift.</p>
      <h3>When to Expect Results</h3>
      <p>Some people feel a difference the first night; for most, the benefit builds with the ritual itself. The stone is a companion, not a switch. Give it two weeks of consistent use, and notice whether your evenings feel a little softer, a little slower, a little more yours.</p>`
  },
  {
    id: "b11",
    category: "guides",
    readTime: "13 min read",
    title: "Chakra Healing with Crystals: A Beginner's Map of the 7 Energy Centers",
    excerpt: "Chakras are the body's seven energy centers, from root to crown. Learn which crystal pairs with each one — and how to begin balancing them in five quiet minutes a day.",
    image: "/images/p003.png",
    content: `<p>You have probably heard the word "chakra" dropped in a yoga class or a wellness post, but the idea is simpler and older than the trend. In many traditions, the body is threaded with energy, and that energy moves through seven main centers. When a center is sluggish or overloaded, something feels off. Crystals are one of the gentlest ways to bring these centers back into balance — and you do not need to be a mystic to start.</p>
      <h3>What Are Chakras?</h3>
      <p>Think of chakras as spinning wheels of energy along the spine, each one linked to a different part of your physical, emotional, and spiritual life. They run from the base of the spine to the top of the head. When energy flows freely through all seven, you tend to feel grounded, open, and alive. When one is blocked, you might feel stuck, anxious, or disconnected in that area of life.</p>
      <h3>The 7 Chakras & Their Crystals</h3>
      <p><strong>1. Root (Muladhara) — safety & grounding.</strong> Located at the base of the spine. When it is balanced you feel safe and steady. Pair it with <em>Red Jasper</em> or <em>Black Obsidian</em> to feel rooted to the earth.</p>
      <p><strong>2. Sacral (Svadhisthana) — creativity & pleasure.</strong> Just below the navel. This is your center of passion and flow. <em>Carnelian</em> warms and opens it, inviting creativity and healthy desire.</p>
      <p><strong>3. Solar Plexus (Manipura) — confidence & will.</strong> At the stomach. It governs self-esteem and personal power. <em>Citrine</em> and <em>Tiger's Eye</em> are its natural allies for courage and motivation.</p>
      <p><strong>4. Heart (Anahata) — love & connection.</strong> At the center of the chest. The bridge between lower and upper chakras. <em>Rose Quartz</em> and <em>Green Aventurine</em> soften and open it to love — of others and of yourself.</p>
      <p><strong>5. Throat (Vishuddha) — truth & expression.</strong> At the throat. It rules how honestly you speak and listen. <em>Blue Lace Agate</em> and <em>Sodalite</em> support clear, kind communication.</p>
      <p><strong>6. Third Eye (Ajna) — intuition & insight.</strong> Between the brows. This is your inner knowing. <em>Amethyst</em> and <em>Lapis Lazuli</em> deepen intuition and quiet mental noise.</p>
      <p><strong>7. Crown (Sahasrara) — spirit & unity.</strong> At the top of the head. It connects you to something larger than yourself. <em>Clear Quartz</em> and <em>Selenite</em> lift and clarify this highest center.</p>
      <h3>How to Work With Chakra Crystals</h3>
      <p>You do not need all seven at once. Three easy approaches: <strong>Wear them</strong> as bracelets or pendants so the stone stays in your field through the day. <strong>Lay them on the body</strong> during a quiet moment — a stone on the chest for the heart, one at the brow for the third eye. Or <strong>arrange them in a row</strong> on a shelf as a visual reminder of balance. Start with the one center you feel most drawn to; the rest tend to follow.</p>
      <h3>A 5-Minute Chakra Scan</h3>
      <p>Sit comfortably and close your eyes. Starting at the base of the spine, imagine a soft light at each center, moving upward: red at the root, orange at the sacral, yellow at the solar plexus, green at the heart, blue at the throat, indigo at the third eye, violet-white at the crown. Rest a corresponding crystal in your palm if you like. With each breath, picture that center glowing a little brighter. Five minutes is enough to feel the shift.</p>
      <h3>Start Small</h3>
      <p>Chakra work is not about perfection — it is about attention. Pick one stone, learn its center, and live with it for a week. Notice where you feel more steady, more open, more yourself. The map above is just a starting point; your own body will tell you which center is asking for care.</p>`
  },
  {
    id: "b12",
    category: "guides",
    readTime: "11 min read",
    title: "Crystals for Manifestation: A Practical Step-by-Step Guide",
    excerpt: "Manifestation is not magic \u2014 it is focused intention meeting daily action. These crystals and a simple 7-step ritual help you attract love, money, and peace with clarity.",
    image: "/images/p007.png",
    content: `<p>You have probably heard that "thoughts become things." Manifestation is simply the practice of aiming your attention, emotion, and action at one clear outcome until it arrives. Crystals are not a shortcut \u2014 but they are a powerful anchor. They give your intention a physical home, a daily reminder, and a quiet focus your scattered mind can return to. This guide walks you through exactly how to manifest with crystals, step by step.</p>
      <h3>What Does "Manifestation" Actually Mean?</h3>
      <p>At its core, manifestation is the alignment of three things: what you <em>think</em>, what you <em>feel</em>, and what you <em>do</em>. A crystal helps hold that alignment when life gets noisy. It is not the source of the outcome \u2014 you are. The stone simply keeps your frequency steady while you do the work.</p>
      <h3>The 7-Step Crystal Manifestation Ritual</h3>
      <p><strong>1. Name one clear desire.</strong> Vague wishes produce vague results. "I want more money" is weak. "I welcome a steady $X of new income this quarter" is clear. Write it down.</p>
      <p><strong>2. Pick a matching stone.</strong> For abundance, reach for <a href="/index.html?product=p007">Citrine</a>, the merchant's stone of wealth, or the <a href="/index.html?product=p012">Green Phantom Wealth Bracelet</a> for business growth. For confidence to act, choose <a href="/index.html?product=p009">Tiger's Eye</a>. To amplify any goal, add <a href="/index.html?product=p013">Clear Quartz</a>.</p>
      <p><strong>3. Cleanse the stone.</strong> Pass it through sage or moonlight so it starts neutral. (See our full <a href="/index.html?blog=b8">crystal care guide</a> for five gentle methods.)</p>
      <p><strong>4. Charge it with your words.</strong> Hold the stone, speak your desire aloud once, and imagine the outcome as already real. Feel it for ten seconds.</p>
      <p><strong>5. Place it where you'll see it.</strong> On your desk, near your wallet, or on a window sill. The point is a daily glance that re-arms your intention.</p>
      <p><strong>6. Take one small action daily.</strong> The crystal focuses you; action moves you. Send the email, make the call, open the account. Manifestation without motion stays a daydream.</p>
      <p><strong>7. Release and trust.</strong> Once a day is set, let it go. Obsessing reverses the energy. Re-center with the stone each morning, then live your day.</p>
      <h3>Manifesting Love vs. Money vs. Peace</h3>
      <p>For love, pair your ritual with <a href="/index.html?product=p001">Rose Quartz</a>, the stone of the open heart. For money, stack Citrine with Clear Quartz. For peace, Amethyst calms the nervous system so your manifestations come from calm, not desperation. The stone changes; the method stays the same.</p>
      <h3>Common Mistakes</h3>
      <p>Collecting twenty stones and using none. Manifesting for others without consent. Re-cleansing every hour from anxiety. Keep it simple: one desire, one stone, one small daily action. That is the whole practice.</p>
      <p>Manifestation is a muscle. Start with one clear wish this week, give it a crystal, and let the ritual do its quiet work.</p>`
  },
  {
    id: "b13",
    category: "crystals",
    readTime: "10 min read",
    title: "The Best Crystals for Protection & Grounding (and How to Use Them Daily)",
    excerpt: "If you feel drained after crowds, scrolling, or hard conversations, you may be an energetic sponge. These protective stones and a 5-minute daily shield ritual help you stay rooted and safe.",
    image: "/images/p005.png",
    content: `<p>Some people walk into a room and absorb everything \u2014 the tension, the noise, the unspoken moods. If that is you, you are not weak; you are sensitive. And sensitive people need boundaries they can wear. That is where protection and grounding crystals come in. They do not "block" life \u2014 they help you stay centered in your own energy instead of leaking it everywhere.</p>
      <h3>Protection vs. Grounding: What's the Difference?</h3>
      <p><strong>Protection</strong> stones absorb or deflect outside energy you do not want \u2014 stress, negativity, the static of a crowded train. <strong>Grounding</strong> stones pull your attention out of your racing head and back into your body and the earth. You usually want both: a shield and an anchor.</p>
      <h3>The Core Protective Stones</h3>
      <p><strong>Black Obsidian & Black Gold Obsidian.</strong> The heaviest protectors in the mineral world. The <a href="/index.html?product=p005">Black Gold Obsidian Shield Bracelet</a> is built for exactly this \u2014 wear it on your right wrist (your projecting side) when you head into draining situations. The <a href="/index.html?product=p006">Black Obsidian Mirror of Truth Pendant</a> sits at the heart center and reflects negativity back out.</p>
      <p><strong>Tiger's Eye.</strong> A grounding-confident stone. The <a href="/index.html?product=p009">Tiger's Eye Warrior Bracelet</a> keeps you steady and clear-headed under pressure \u2014 ideal for meetings, travel, or conflict.</p>
      <p><strong>Amethyst.</strong> Soft protection for the mind. The <a href="/index.html?product=p004">Amethyst Serenity Bracelet</a> shields against mental overload and is gentle enough to sleep in.</p>
      <h3>A 5-Minute Daily Shield Ritual</h3>
      <p><strong>1.</strong> Hold your protective stone in both hands for thirty seconds before leaving the house.</p>
      <p><strong>2.</strong> Set the intention silently: "I stay rooted in my own energy. What is not mine, I release."</p>
      <p><strong>3.</strong> Wear it on the right wrist or as a pendant touching the chest.</p>
      <p><strong>4.</strong> At day's end, take it off and pass it through incense smoke or set it on a <a href="/index.html?blog=b8">Selenite plate</a> to clear what it absorbed.</p>
      <p><strong>5.</strong> Notice. Within a week you will feel less "pinged" by other people's moods.</p>
      <h3>Where to Keep Them</h3>
      <p>One stone by the front door absorbs outside energy before it enters. One on your desk shields your workspace. One in your pocket travels with you. You do not need many \u2014 you need the right few, used consistently.</p>
      <h3>Who Needs This Most</h3>
      <p>Empaths, healthcare workers, teachers, anyone in open-plan offices or constant video calls. If you end most days wiped out for no obvious reason, protection crystals are not woo \u2014 they are a wearable boundary. Start with one stone this week and feel the difference.</p>`
  }
];

window.PRODUCTS = PRODUCTS;

// Load the latest product data (incl. images/stock managed in the admin panel)
// from the backend API. Falls back to the embedded PRODUCTS above if the API
// is unavailable. The admin panel is the single source of truth for products.
async function refreshProducts() {
  try {
    const resp = await fetch('/api/products');
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.products) && data.products.length) {
        PRODUCTS = data.products;
        window.PRODUCTS = PRODUCTS;
        return true;
      }
    }
  } catch (e) {
    console.warn('[Aurae] Could not load products from API, using local data.', e);
  }
  return false;
}
