export default [
	{
		name: "Academics",
		category: "Mental",
		description: ["Academics is a broad-based Skill that represents a character’s degree of higher education and general knowledge in the Arts and Humanities — everything from English to history, economics to law. Dots in this Skill do not directly correlate to a given level of education. Your character could have entered a doctorate program but spent more time partying than studying, resulting in low dots. Conversely, a self-taught individual who read voraciously and studied intensively could have high dots without ever earning a diploma."],
		possessedBy: [
			"College graduates",
			"Executives",
			"Lawyers",
			"Librarians",
			"Scholars",
			"Students"
		],
		specialties: [
			"Anthropology",
			"Art",
			"English",
			"History",
			"Law",
			"Religion",
			"Research"
		]
	},
	{
		name: "Computer",
		category: "Mental",
		description: ["Characters possessing this Skill have the necessary training or experience to operate a computer. At high levels (3 or more), a character can create his own computer programs. People with high levels in this Skill are familiar with a variety of programming languages and operating systems. Note that dots in Computer do not apply to manually fixing or building machines, only to operating them. Construction and repair is the province of the Crafts Skill (see below)."],
		possessedBy: [
			"Business People",
			"Professors",
			"Programmers",
			"Students",
			"Sys-admins"
		],
		specialties: [
			"Artificial Intelligence",
			"Data Retrieval",
			"Graphics",
			"Hacking",
			"Internet"
		]
	},
	{
		name: "Crafts",
		category: "Mental",
		description: ["Crafts represents a character’s training or experience in creating works of physical art or construction with his hands, from paintings to car engines to classical sculpture. Characters possessing this Skill typically have the knowledge, but not necessarily the tools or facilities to make use of their capabilities. A character might be unexceptional mechanic, for example, but still needs to sweet-talk his boss into opening up the garage after-hours to work on his friend’s car. Crafting a piece of art or creating an object is almost always an extended roll, with the length of time and number of successes required determined by the complexity of the piece. The Storyteller has final say on the time required and the number of successes needed for a particular item."],
		possessedBy: [
			"Contractors",
			"Mechanics",
			"Plumbers",
			"Sculptors",
			"Welders"
		],
		specialties: [
			"Automobiles",
			"Aircraft",
			"Forging",
			"Jury-Rigging",
			"Sculpting",
			"Sewing"
		]
	},
	{
		name: "Investigation",
		category: "Mental",
		description: ["Investigation is the art and science of solving mysteries, examining seemingly disparate evidence to find a connection, answering riddles and overcoming paradoxes. It not only allows your character to get into the head of a killer to grasp his motives or plans, it allows her to look beyond the mundane world to guess at answers to mysterious problems, or to have a “eureka” moment that offers insight into baffling circumstances. Your character might realize that all murder victims have the same digits jumbled in their phone numbers, she might interpret a dream that has striking similarities to events in the real world, or she could recognize why an intruder took the time to paint a room red. Certain individuals such as law-enforcement officers, forensic specialists, scientists and investigators are trained in the art of examination, while others simply develop the knack through years of practice.", "Note that Investigation is different from the perception Attribute task detailed on p. 45. Perception (Wits + Composure or Wits + another Skill) is typically checked when a character could spot something unusual or amiss when she isn’t actually looking for it. Investigation-based rolls are typically made when a character actively studies a situation. Dots in Investigation don’t give a character sudden insight or capability in the realms of other Skills, however. She can’t miraculously identify changing brushstrokes in a painting, for example. That would be the realm of Academics or Crafts. But she might identify how the placement of paintings throughout a house creates a pattern and imparts a message."],
		possessedBy: [
			"Criminals",
			"Doctors",
			"Forensic examiners",
			"Police officers",
			"Scientists",
			"Scholars",
			"Soldiers"
		],
		specialties: [
			"Artifacts",
			"Body Language",
			"Crime Scenes",
			"Cryptography",
			"Dreams",
			"Autopsy Diagnoses",
			"Puzzles",
			"Riddles",
			"Scientific Experiments"
		]
	},
	{
		name: "Medicine",
		category: "Mental",
		description: ["The Medicine Skill reflects a character’s training and expertise in human physiology and how to treat injuries and illness. The trait represents knowledge of human anatomy and basic medical treatments. Characters with a low level in this Skill (1 to 2) often possess only rudimentary first-aid training, while characters with high levels (3+) are the equivalent of physicians or surgeons."],
		possessedBy: [
			"Medical students",
			"Paramedics",
			"Physicians",
			"Psychologists",
			"Surgeons"
		],
		specialties: [
			"Emergency Care",
			"Pathology",
			"Pharmaceuticals",
			"Physical Therapy",
			"Surgery"
		]
	},
	{
		name: "Occult",
		category: "Mental",
		description: ["The Occult Skill reflects a character’s knowledge and experience with the world’s various legends and lore about the supernatural. A character with this Skill not only knows the theories, myths and legends of the occult, but can generally discern “fact” from rumor. Characters may come by this Skill in a variety of ways, from oddball college courses to learning legends and myths from the lips of superstitious family members."],
		possessedBy: [
			"Anthropologists",
			"Authors",
			"Neo-pagans",
			"Occult scholars",
			"Parapsychologists"
		],
		specialties: [
			"Cultural Beliefs",
			"Ghosts",
			"Magic",
			"Monsters",
			"Superstitions",
			"Witchcraft"
		]
	},
	{
		name: "Politics",
		category: "Mental",
		description: ["Characters possessing this Skill are not only familiar with the way the political process works, they’re experienced with bureaucracies and know exactly who to call in a given situation to get something done. Your character keeps track of who’s in power and how she got there, along with her potential rivals. He has a grasp of the issues of the moment and how they affect the political process, and knows whose palms to grease. It’s possible that your character acquired this Skill by running for political office at some point, or by working on a campaign or as a public servant. Or he could simply be someone who follows the news and understands the money trail."],
		possessedBy: [
			"Bureaucrats",
			"Civil servants",
			"Journalists",
			"Lawyers",
			"Lobbyists",
			"Politicians"
		],
		specialties: [
			"Bribery",
			"Elections",
			"Federal",
			"Local",
			"State",
			"Scandals"
		]
	},
	{
		name: "Science",
		category: "Mental",
		description: ["This Skill represents your character’s understanding of the physical and natural sciences: biology, chemistry, geology, meteorology, physics. Science is useful not only for understanding how the world works, but it helps characters make the most of the resources at hand to achieve their goals. A character with a strong Science background could describe the chemical process for plating metals, for example, allowing another character with Crafts to make a silver-edged steel sword."],
		possessedBy: [
			"Engineers",
			"Scientists",
			"Students",
			"Teachers",
			"Technicians"
		],
		specialties: [
			"Biology",
			"Chemistry",
			"Geology",
			"Metallurgy",
			"Physics"
		]
	},
	{
		name: "Athletics",
		category: "Physical",
		description: ["Athletics encompasses a broad category of physical training, from rock climbing to kayaking to professional sports such as football or hockey. The Athletics Skill can be applied to any action that requires prolonged physical exertion or that demands considerable agility or handeye coordination. Examples include climbing a high wall, marching long distances and leaping between rooftops. In combat, the Skill is combined with Dexterity to determine the accuracy of thrown weapons."],
		possessedBy: [
			"Professional athletes",
			"Police officers",
			"Soldiers",
			"Survivalists",
			"Physical trainers"
		],
		specialties: [
			"Acrobatics",
			"Climbing",
			"Kayaking",
			"Long Distance Running",
			"Sprinting",
			"Swimming",
			"Throwing"
		]
	},
	{
		name: "Brawl",
		category: "Physical",
		description: ["Brawl defines your character’s prowess at unarmed combat, whether he’s a black belt in karate, a hard-bitten street tough or a college student who’s taken a few selfdefense courses. Characters with this Skill know how to hit an opponent, where to hit for maximum effect and how to defend themselves from attack. It can mean using fists, but also elbows, knees, shoulders, head butts wrestling, joint locks and choke holds. Characters with a several dots could be familiar with multiple techniques of unarmed combat. Expertise in such techniques is reflected in the Fighting Style Merits (see pp. 110-112), which are based on Brawl. Brawl is added to your character’s Strength to battle people in unarmed combat."],
		possessedBy: [
			"Bikers",
			"Boxers",
			"Gangsters",
			"Police officers",
			"Soldiers"
		],
		specialties: [
			"Blocking",
			"Boxing",
			"Dirty Tricks",
			"Grappling",
			"Kung Fu",
			"Throws"
		]
	},
	{
		name: "Drive",
		category: "Physical",
		description: ["The Drive Skill allows your character to operate a vehicle under difficult or dangerous conditions. Characters don’t need this Skill simply to drive a car. It’s safe to assume in a modern society that most individuals are familiar with automobiles and the rules of the road. Rather, this trait covers the training or experience necessary to operate at high speeds, to tackle hazardous road conditions and to push a vehicle to the limits of its performance. Drive is the difference between a typical suburban parent with a minivan and a police officer, car thief or racecar driver. (See “Handling” on p. 146 for dice-pool equipment modifiers for various vehicles.)",
		"The Skill also applies to piloting and controlling boats; your character’s Drive dots are applied equally to handling boats. In order for your character to be able to pilot a plane, he needs a Pilot Specialty in the Skill. With that, efforts to control a plane call for a Drive-based roll, plus one die for your character’s Pilot Specialty. A character with the Drive Skill who does not possess a Pilot Specialty cannot effectively operate a plane. His efforts to fly are based on Attribute alone, at a -1 untrained penalty. Note that dots in Drive do not apply to manually fixing or building vehicles, only to operating them. Construction and repair is the province of the Crafts Skill (see p. 57)."],
		possessedBy: [
			"Car thieves",
			"Couriers",
			"Delivery drivers",
			"Emergency responders",
			"Police officers",
			"Racecar drivers"
		],
		specialties: [
			"High-Performance Cars",
			"Motorcycles",
			"Off-Road",
			"Pursuit",
			"Shaking Tails",
			"Stunts"
		]
	},
	{
		name: "Firearms",
		category: "Physical",
		description: ["Firearms allows your character to identify, operate and maintain most types of guns, from pistols to rifles to military weapons such as submachine guns, assault rifles and machine guns. This Skill can represent the kind of formal training provided to police and the military, or the basic, hands-on experience common to hunters, criminals and gun enthusiasts. Firearms also applies to using bows. Your character can use guns and bows equally. Note that dots in Firearms do not apply to manually fixing or building guns, only to wielding them. Construction and repair is the province of the Crafts Skill (see p. 57)."],
		possessedBy: [
			"Criminals",
			"Gun dealers",
			"Hunters",
			"Police officers",
			"Soldiers",
			"Survivalists"
		],
		specialties: [
			"Autofire",
			"Bow",
			"Pistol",
			"Rifle",
			"Shotgun",
			"Sniping",
			"Trick Shot"
		]
	},
	{
		name: "Larceny",
		category: "Physical",
		description: ["Larceny is a broad Skill that covers everything from picking locks to concealing stolen goods and everything in between. Most characters obtain this Skill the hard way, by committing crimes and often paying the price for their mistakes. Some individuals such as government agents and members of the military receive formal training in bypassing security systems and stealing valuable assets."],
		possessedBy: [
			"Burglars",
			"Commandos",
			"Government agents",
			"Private eyes"
		],
		specialties: [
			"Concealing Stolen Goods",
			"Lockpicking",
			"Pickpocketing",
			"Security Systems",
			"Safecracking"
		]
	},
	{
		name: "Stealth",
		category: "Physical",
		description: ["The Stealth Skill represents a character’s experience or training in avoiding notice, whether by moving silently, making use of cover or blending into a crowd. When attempting to sneak silently through an area or to use the local terrain as concealment, roll Dexterity + Stealth+ equipment. When trying to remain unseen in a crowd, Wits + Stealth is appropriate. The Storyteller may make Stealth rolls secretly on your behalf, since your character usually has no way of knowing he’s been noticed until it’s too late. If your character attempts to avoid notice by a group of alert observers, a contested roll versus the observers’ Wits + Composure + equipment is required."],
		possessedBy: [
			"Criminals",
			"Hunters",
			"Police officers",
			"Private investigators"
		],
		specialties: [
			"Camouflage",
			"Crowds",
			"Moving in Darkness",
			"Moving in Woods"
		]
	},
	{
		name: "Survival",
		category: "Physical",
		description: ["Survival represents your character’s experience or training in “living off the land.” He knows where to find food and shelter, and how to endure harsh environmental conditions. The more capable your character is, the fewer resources he needs in order to prevail. A master survivalist can walk into a forest, desert or mountainous region with little more than a pocketknife and the clothes on his back and survive for weeks if necessary. Note that Survival is not synonymous with Animal Ken (see p. 78). The former helps your character stay alive in the wilderness, living off the land with whatever supplies he has brought with him. The latter involves understanding animal behavior and interacting directly with animals. Your character could be knowledgeable in creating shelter and gathering plants to eat (Survival), but might know nothing about anticipating the actions of a bear in his camp (Animal Ken)."],
		possessedBy: [
			"Explorers",
			"Hunters",
			"Soldiers",
			"Survivalists"
		],
		specialties: [
			"Foraging",
			"Navigation",
			"Meteorology",
			"Shelter"
		]
	},
	{
		name: "Weaponry",
		category: "Physical",
		description: ["As the name implies, the Weaponry Skill represents your character’s experience or training in fighting with everything from beer bottles to pipes, knives to swords. While formal instruction in Weaponry is uncommon (restricted to military and law-enforcement training and a few martial arts), any character who has grown up on the street or spent a lot of time in seedy bars has had ample opportunity to learn this Skill. A character’s Weaponry is added to his Strength to stage armed attacks. For more information, see Chapter 7: Combat. Note that dots in Weaponry do not apply to manually fixing or creating weapons, only to wielding them. Construction and repair is the province of the Crafts Skill (see p. 57)."],
		possessedBy: [
			"Bikers",
			"Criminals",
			"Martial artists",
			"Police officers",
			"Soldiers"
		],
		specialties: [
			"Improvised Weapons",
			"Knives",
			"Swords"
		]
	},
	{
		name: "AnimalKen",
		category: "Social",
		description: ["Anticipating and understanding human emotions is one thing, but being able to interpret and recognize the behavior of animals is something else entirely. Your character intuitively grasps or has been trained to read animals to know how they react to situations. The Skill also involves innately understanding how the animal mind operates, and what may appease or enrage beasts. The knack often coincides with a respect for animals, but it could derive from the analytical observation of a lab scientist or from years of abuse inflicted by a callous animal handler. Animal Ken could be applied to grasp the thoughts or intentions of supernatural animals, if the Storyteller allows. Sometimes these beings have human or greater intelligence and cannot be read by this Skill alone."],
		possessedBy: [
			"Animal rescue workers",
			"Hunters",
			"Longtime pet owners",
			"Park rangers",
			"Ranchers",
			"Trainers",
			"Veterinarians"
		],
		specialties: [
			"Animal Needs",
			"Imminent Attack",
			"Specific Kind of Animal",
			"Training"
		]
	},
	{
		name: "Empathy",
		category: "Social",
		description: ["This Skill represents your character’s intuition for reading people’s emotions. For some, it’s a matter of observing body language and non-verbal cues. Others employ an extraordinary sense that helps them divine a person’s true mood. As the name implies, Empathy also involves the capacity to understand other people’s views and perspectives, whether your character agrees with those positions or not. This is useful in everything from negotiations and crisis counseling to reading faces in a crowd and looking for potential trouble. If a subject actively conceals his emotions or motives, make a contested roll versus the person’s Wits + Subterfuge + equipment."],
		possessedBy: [
			"Counselors",
			"Diplomats",
			"Entertainers",
			"Profilers",
			"Psychiatrists",
			"Police officers"
		],
		specialties: [
			"Emotion",
			"Lies",
			"Motives",
			"Personalities"
		]
	},
	{
		name: "Expression",
		category: "Social",
		description: ["Expression reflects your character’s training or experience in the art of communication, both to entertain and inform. This Skill covers both the written and spoken word and other forms of entertainment, from journalism to poetry, creative writing to acting, music to dance. Characters can use it to compose written works or to put the right words together at the spur of the moment to deliver a rousing speech or a memorable toast. Used well, Expression can sway others’ opinions or even hold an audience captive. Whencomposinga poem or writing a novel, roll Wits or Intelligence (depending on whether the work is poetic or factual) + Expression. When recitingto an audience, roll Presence + Expression. Playing an instrument involves Intelligence + Expression for a known piece, and Wits + Expression for an improvised one. Dance calls for Dexterity + Expression."],
		possessedBy: [
			"Actors",
			"Ballet dancers",
			"Journalists",
			"Musicians",
			"Poets",
			"Rock stars",
			"Writers"
		],
		specialties: [
			"Classical Dance",
			"Drama",
			"Exposés",
			"Musical Instrument",
			"Newspaper Articles",
			"Speeches"
		]
	},
	{
		name: "Intimidation",
		category: "Social",
		description: ["Intimidation is the art and technique of persuading others through the use of fear. Your character can intimidate someone with a show of brute force (Strength + Intimidation), through more subtle means such as verbal threats (Manipulation + Intimidation), or simply through menacing body language (Presence + Intimidation). It can be used to get other people to cooperate (even against their better judgment), back down from a confrontation, or reveal information that they’d rather not share."],
		possessedBy: [
			"Bodyguards",
			"Bouncers",
			"Gangsters",
			"Executives",
			"Police officers",
			"Soldiers"
		],
		specialties: [
			"Bluster",
			"Physical Threats",
			"Stare-Downs",
			"Torture",
			"Veiled Threats"
		]
	},
	{
		name: "Persuasion",
		category: "Social",
		description: ["Persuasion is the art of inspiring or changing minds through logic, charm or sheer, glib fast-talking. Though it can be taught to varying degrees of success, most characters with the Skill possess a natural talent and have honed it over years through trial and error, practicing their delivery until it rolls effortlessly off the tongue. Persuasion is the Skill of convincing others by force of personality alone, making one’s point through carefully chosen words, body language and emotion."],
		possessedBy: [
			"Con artists",
			"Executives",
			"Generals",
			"Lawyers",
			"Politicians",
			"Salesmen",
			"Sexual predators"
		],
		specialties: [
			"Fast-Talking",
			"Inspiring Troops",
			"Motivational Speeches",
			"Sales Pitches",
			"Seduction"
		]
	},
	{
		name: "Socialize",
		category: "Social",
		description: ["Socialize reflects your character’s ability to interact with others in a variety of situations, from talking people up at bars to comporting himself with dignity at state dinners. This Skill represents equal parts gregariousness, sensitivity, etiquette and custom. Knowing how to make friends is no less important than understanding how to treat guests in formal situations. Characters with low dots might be naturally entertaining or approachable, but unschooled in the finer arts of social interaction. Or they could be punctilious with their manners but difficult to approach. Conversely, characters with high dots could have the social graces of a practiced diplomat or raconteur, knowing just what to say and when to say it in any given situation."],
		possessedBy: [
			"Diplomats",
			"Entertainers",
			"Executives",
			"Politicians",
			"Salesmen"
		],
		specialties: [
			"Bar Hopping",
			"Dress Balls",
			"Formal Events",
			"Frat Parties",
			"State Dinners"
		]
	},
	{
		name: "Streetwise",
		category: "Social",
		description: ["Characters possessing this Skill know how life on the streets works and are adept at surviving by its harsh rules. Streetwise characters can gather information, make contacts, buy and sell on the black market, and otherwise make use of the street’s unique resources. The Skill is also important for navigating urban dangers, avoiding the law, and staying on the right side of the wrong people."],
		possessedBy: [
			"Criminals",
			"Gangsters",
			"Homeless people",
			"Private investigators",
			"Police officers"
		],
		specialties: [
			"Black Market",
			"Gangs",
			"Rumors",
			"Undercover Operations"
		]
	},
	{
		name: "Subterfuge",
		category: "Social",
		description: ["Subterfuge is the art of deception. Characters possessing this Skill know how to lie convincingly, and they recognize when they’re being lied to. Subterfuge is used when telling a convincing falsehood, hiding one’s emotions or reactions, or trying to pick up on the same in others. The Skill is most often used to trick other people, but characters also learn it to avoid being tricked themselves."],
		possessedBy: [
			"Actors",
			"Con artists",
			"Grifters",
			"Lawyers",
			"Politicians",
			"Teenagers"
		],
		specialties: [
			"Con Jobs",
			"Hiding Emotions",
			"Lying",
			"Misdirection",
			"Spotting Lies"
		]
	}
]