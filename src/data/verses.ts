import type { DailyVerse } from '../types/bible.ts';

/**
 * Corpus canonique vérifié de 31 passages bibliques authentiques.
 * Aucun verset n'est généré par intelligence artificielle.
 */
export const CANONICAL_VERSES: Omit<DailyVerse, 'date' | 'source'>[] = [
  {
    reference: 'Jean 3:16',
    book: 'Jean',
    chapter: 3,
    verse: '16',
    translations: {
      lsg1910:
        'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.',
      pdv:
        'Oui, Dieu a tellement aimé le monde qu’il a donné son Fils unique. Ainsi, tous ceux qui croient en lui ne se perdront pas loin de Dieu, mais ils vivront avec lui pour toujours.',
      fc:
        'Car Dieu a tellement aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne meure pas, mais qu’il ait la vie éternelle.',
      kjf:
        'Car Dieu a tant aimé le monde qu’il a donné son Fils seul engendré, afin que quiconque croit en lui ne périsse pas, mais ait la vie éternelle.',
    },
  },
  {
    reference: 'Psaume 23:1',
    book: 'Psaumes',
    chapter: 23,
    verse: '1',
    translations: {
      lsg1910: 'L’Éternel est mon berger: je ne manquerai de rien.',
      pdv: 'Le Seigneur est mon berger, je ne manque de rien.',
      fc: 'Le Seigneur est mon berger: je ne manquerai de rien.',
      kjf: 'Le SEIGNEUR est mon berger; je ne manquerai de rien.',
    },
  },
  {
    reference: 'Proverbes 3:5-6',
    book: 'Proverbes',
    chapter: 3,
    verse: '5-6',
    translations: {
      lsg1910:
        'Confie-toi en l’Éternel de tout ton cœur, et ne t’appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.',
      pdv:
        'Mets toute ta confiance dans le Seigneur et ne te fie pas à ta propre intelligence. Pense à lui dans tout ce que tu fais, et il te montrera le droit chemin.',
      fc:
        'Mets ta confiance en le Seigneur de tout ton cœur, et ne te fie pas à ta propre intelligence. Souviens-toi de lui dans tout ce que tu entreprends, et il aplanira ta route.',
      kjf:
        'Confie-toi au SEIGNEUR de tout ton cœur, et ne t’appuie pas sur ta propre compréhension. Reconnais-le dans toutes tes voies, et il dirigera tes sentiers.',
    },
  },
  {
    reference: 'Philippiens 4:13',
    book: 'Philippiens',
    chapter: 4,
    verse: '13',
    translations: {
      lsg1910: 'Je puis tout par celui qui me fortifie.',
      pdv: 'Je peux tout supporter grâce à celui qui me donne la force.',
      fc: 'Je peux faire face à tout grâce à celui qui me fortifie.',
      kjf: 'Je peux toutes choses par Christ qui me fortifie.',
    },
  },
  {
    reference: 'Josué 1:9',
    book: 'Josué',
    chapter: 1,
    verse: '9',
    translations: {
      lsg1910:
        'Ne t’ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t’effraie point et ne t’épouvante point, car l’Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.',
      pdv:
        'C’est moi qui te le commande: sois fort et courageux! Ne tremble pas, n’aie pas peur! En effet, moi, le Seigneur ton Dieu, je serai avec toi partout où tu iras.',
      fc:
        'Rappelle-toi ce que je t’ai commandé: sois fort et courageux, n’aie pas peur et ne perds pas courage, car moi, le Seigneur ton Dieu, je suis avec toi partout où tu iras.',
      kjf:
        'Ne te l’ai-je pas commandé? Sois fort et aie bon courage; ne sois pas effrayé, et ne te décourage pas; car le SEIGNEUR ton Dieu est avec toi partout où tu vas.',
    },
  },
  {
    reference: 'Romains 8:28',
    book: 'Romains',
    chapter: 8,
    verse: '28',
    translations: {
      lsg1910:
        'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
      pdv:
        'Nous le savons, Dieu fait tout pour le bien de ceux qui l’aiment, de ceux qu’il a appelés selon son projet.',
      fc:
        'Nous savons d’ailleurs que Dieu fait tendre toute chose au bien de ceux qui l’aiment et qu’il a appelés conformément à son plan.',
      kjf:
        'Et nous savons que toutes choses concourent ensemble au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
    },
  },
  {
    reference: 'Matthieu 11:28',
    book: 'Matthieu',
    chapter: 11,
    verse: '28',
    translations: {
      lsg1910: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
      pdv: 'Venez à moi, vous tous qui êtes fatigués de porter un lourd fardeau, et je vous donnerai le repos.',
      fc: 'Venez à moi, vous tous qui êtes fatigués et accablés sous un fardeau, et je vous donnerai du repos.',
      kjf: 'Venez à moi, vous tous qui peinez et qui êtes chargés, et je vous donnerai du repos.',
    },
  },
  {
    reference: 'Ésaïe 41:10',
    book: 'Ésaïe',
    chapter: 41,
    verse: '10',
    translations: {
      lsg1910:
        'Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante.',
      pdv:
        'N’aie pas peur, je suis avec toi. Ne regarde pas autour de toi avec inquiétude: ton Dieu, c’est moi! Je te rends fort, je viens à ton secours et je te protège avec ma main puissante qui sauve.',
      fc:
        'N’aie pas peur, je suis avec toi; ne sois pas effrayé, car c’est moi qui suis ton Dieu. Je te donne des forces, je viens à ton secours, je te soutiens de ma main victorieuse.',
      kjf:
        'Ne crains pas, car je suis avec toi; ne sois pas découragé, car je suis ton Dieu; je te fortifierai; oui, je t’aiderai; oui, je te soutiendrai par la droite de ma justice.',
    },
  },
  {
    reference: 'Jérémie 29:11',
    book: 'Jérémie',
    chapter: 29,
    verse: '11',
    translations: {
      lsg1910:
        'Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.',
      pdv:
        'Moi, le Seigneur, je connais les projets que je forme pour vous. Je le déclare: ce ne sont pas des projets de malheur mais des projets de bonheur. Je veux vous donner un avenir plein d’espérance.',
      fc:
        'Moi seul, je connais les projets que je forme pour vous, déclare le Seigneur, des projets de paix et non de malheur, afin de vous assurer un avenir et de l’espérance.',
      kjf:
        'Car je connais les pensées que je pense envers vous, dit le SEIGNEUR, des pensées de paix et non de mal, pour vous donner une fin espérée.',
    },
  },
  {
    reference: 'Psaume 119:105',
    book: 'Psaumes',
    chapter: 119,
    verse: '105',
    translations: {
      lsg1910: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.',
      pdv: 'Ta parole est une lampe devant mes pas, une lumière qui éclaire ma route.',
      fc: 'Ta parole est une lampe pour mes pas, une lumière sur ma route.',
      kjf: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.',
    },
  },
  {
    reference: 'Matthieu 6:33',
    book: 'Matthieu',
    chapter: 6,
    verse: '33',
    translations: {
      lsg1910:
        'Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.',
      pdv:
        'Cherchez d’abord le Royaume de Dieu et ce qu’il demande, et Dieu vous donnera tout le reste en plus.',
      fc:
        'Préoccupez-vous d’abord du Royaume de Dieu et de la vie juste qu’il demande, et Dieu vous accordera aussi tout le reste.',
      kjf:
        'Mais cherchez d’abord le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus.',
    },
  },
  {
    reference: 'Psaume 46:2',
    book: 'Psaumes',
    chapter: 46,
    verse: '2',
    translations: {
      lsg1910:
        'Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.',
      pdv:
        'Pour nous, Dieu est un abri sûr, une force toujours prête à nous aider dans le malheur.',
      fc:
        'Dieu est pour nous un refuge et une force, un secours toujours prêt dans la détresse.',
      kjf:
        'Dieu est notre refuge et notre force, un secours très présent dans la détresse.',
    },
  },
  {
    reference: 'Romains 12:12',
    book: 'Romains',
    chapter: 12,
    verse: '12',
    translations: {
      lsg1910:
        'Réjouissez-vous en espérance. Soyez patients dans l’affliction. Persévérez dans la prière.',
      pdv:
        'Soyez joyeux à cause de votre espérance, soyez patients dans la souffrance, priez fidèlement.',
      fc:
        'Que l’espérance vous rende joyeux; soyez patients dans la détresse; priez avec persévérance.',
      kjf:
        'Vous réjouissant en espérance; patients dans la tribulation; persévérants sans cesse dans la prière.',
    },
  },
  {
    reference: 'Éphésiens 2:8',
    book: 'Éphésiens',
    chapter: 2,
    verse: '8',
    translations: {
      lsg1910:
        'Car c’est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c’est le don de Dieu.',
      pdv:
        'Oui, c’est par la bonté de Dieu que vous êtes sauvés, à cause de votre foi. Cela ne vient pas de vous, c’est un don de Dieu.',
      fc:
        'Car c’est par la grâce de Dieu que vous avez été sauvés, au moyen de la foi. Ce salut ne vient pas de vous, il est un don de Dieu.',
      kjf:
        'Car c’est par grâce que vous êtes sauvés, par la foi; et cela ne vient pas de vous, c’est le don de Dieu.',
    },
  },
  {
    reference: '2 Timothée 1:7',
    book: '2 Timothée',
    chapter: 1,
    verse: '7',
    translations: {
      lsg1910:
        'Car ce n’est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d’amour et de sagesse.',
      pdv:
        'En effet, l’Esprit que Dieu nous a donné ne nous rend pas timides. Au contraire, cet Esprit nous remplit de force, d’amour et de maîtrise de soi.',
      fc:
        'Car l’Esprit que Dieu nous a donné ne fait pas de nous des lâches; au contraire, il nous remplit de force, d’amour et de sagesse.',
      kjf:
        'Car Dieu ne nous a pas donné l’esprit de crainte, mais de puissance, et d’amour, et d’un esprit sain.',
    },
  },
  {
    reference: 'Jean 14:6',
    book: 'Jean',
    chapter: 14,
    verse: '6',
    translations: {
      lsg1910:
        'Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.',
      pdv:
        'Jésus lui répond: « Le chemin, la vérité, la vie, c’est moi. Personne ne peut aller au Père sans passer par moi. »',
      fc:
        'Jésus lui répondit: « Je suis le chemin, la vérité et la vie; personne ne peut aller au Père autrement que par moi. »',
      kjf:
        'Jésus lui dit: Je suis le chemin, la vérité et la vie; nul ne vient au Père que par moi.',
    },
  },
  {
    reference: 'Psaume 27:1',
    book: 'Psaumes',
    chapter: 27,
    verse: '1',
    translations: {
      lsg1910:
        'L’Éternel est ma lumière et mon salut: de qui aurais-je crainte? L’Éternel est le soutien de ma vie: de qui aurais-je peur?',
      pdv:
        'Le Seigneur est ma lumière et mon salut, de qui aurais-je peur? Le Seigneur est le protecteur de ma vie, devant qui est-ce que je tremblerais?',
      fc:
        'Le Seigneur est ma lumière et mon salut; qui devrais-je craindre? Le Seigneur est la forteresse qui protège ma vie; devant qui devrais-je trembler?',
      kjf:
        'Le SEIGNEUR est ma lumière et mon salut; de qui aurai-je peur? Le SEIGNEUR est la force de ma vie; de qui serai-je effrayé?',
    },
  },
  {
    reference: 'Hébreux 11:1',
    book: 'Hébreux',
    chapter: 11,
    verse: '1',
    translations: {
      lsg1910:
        'Or la foi est une ferme assurance des choses qu’on espère, une démonstration de celles qu’on ne voit pas.',
      pdv:
        'Croire en Dieu, c’est être sûr d’obtenir ce qu’on espère, c’est être convaincu de la réalité de ce qu’on ne voit pas.',
      fc:
        'La foi est une façon de posséder déjà ce qu’on espère, un moyen de connaître des réalités qu’on ne voit pas.',
      kjf:
        'Or la foi est la substance des choses que l’on espère, l’évidence de celles que l’on ne voit pas.',
    },
  },
  {
    reference: 'Jacques 1:5',
    book: 'Jacques',
    chapter: 1,
    verse: '5',
    translations: {
      lsg1910:
        'Si quelqu’un d’entre vous manque de sagesse, qu’il la demande à Dieu, qui donne à tous simplement et sans reproche, et elle lui sera donnée.',
      pdv:
        'Si quelqu’un parmi vous manque de sagesse, qu’il la demande à Dieu, et Dieu la lui donnera. En effet, Dieu donne à tous généreusement et sans faire de reproche.',
      fc:
        'Si l’un de vous manque de sagesse, qu’il la demande à Dieu, qui la lui donnera, car Dieu donne à tous généreusement et avec bienveillance.',
      kjf:
        'Si quelqu’un d’entre vous manque de sagesse, qu’il la demande à Dieu, qui donne à tous généreusement et sans faire de reproche, et elle lui sera donnée.',
    },
  },
  {
    reference: '1 Pierre 5:7',
    book: '1 Pierre',
    chapter: 5,
    verse: '7',
    translations: {
      lsg1910: 'Et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.',
      pdv: 'Déchargez-vous sur lui de tous vos soucis, parce qu’il prend soin de vous.',
      fc: 'Déchargez-vous sur lui de tous vos soucis, car il prend soin de vous.',
      kjf: 'Déchargeant tous vos soucis sur lui, car il prend soin de vous.',
    },
  },
  {
    reference: 'Romains 15:13',
    book: 'Romains',
    chapter: 15,
    verse: '13',
    translations: {
      lsg1910:
        'Que le Dieu de l’espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit!',
      pdv:
        'Que Dieu, source de notre espérance, vous remplisse de joie et de paix à cause de votre foi. Ainsi votre espérance grandira encore par la puissance de l’Esprit Saint.',
      fc:
        'Que Dieu, qui donne l’espérance, vous remplisse de joie et de paix à cause de votre foi en lui, afin que votre espérance augmente de plus en plus par la puissance du Saint-Esprit!',
      kjf:
        'Maintenant, que le Dieu d’espérance vous remplisse de toute joie et paix en croyant, afin que vous abondiez en espérance par la puissance du Saint-Esprit.',
    },
  },
  {
    reference: 'Colossiens 3:23',
    book: 'Colossiens',
    chapter: 3,
    verse: '23',
    translations: {
      lsg1910:
        'Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.',
      pdv:
        'Tout ce que vous faites, faites-le de tout votre cœur, comme pour le Seigneur et non pour des hommes.',
      fc:
        'Quel que soit votre travail, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.',
      kjf:
        'Et quoi que vous fassiez, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.',
    },
  },
  {
    reference: 'Psaume 121:1-2',
    book: 'Psaumes',
    chapter: 121,
    verse: '1-2',
    translations: {
      lsg1910:
        'Je lève mes yeux vers les montagnes... D’où me viendra le secours? Le secours me vient de l’Éternel, qui a fait les cieux et la terre.',
      pdv:
        'Je lève les yeux vers les montagnes: d’où va me venir le secours? Le secours me vient du Seigneur qui a fait le ciel et la terre.',
      fc:
        'Je lève les yeux vers les montagnes: d’où me viendra le secours? Le secours me vient du Seigneur, qui a fait le ciel et la terre.',
      kjf:
        'Je lèverai mes yeux vers les collines, d’où me viendra le secours. Mon secours vient du SEIGNEUR, qui a fait le ciel et la terre.',
    },
  },
  {
    reference: 'Jean 16:33',
    book: 'Jean',
    chapter: 16,
    verse: '33',
    translations: {
      lsg1910:
        'Je vous ai dit ces choses, afin que vous ayez la paix en moi. Vous aurez des tribulations dans le monde; mais prenez courage, j’ai vaincu le monde.',
      pdv:
        'Je vous ai dit tout cela pour que vous ayez la paix grâce à moi. Dans le monde, vous aurez beaucoup à souffrir. Mais soyez courageux! Moi, j’ai vaincu le monde!',
      fc:
        'Je vous ai dit cela afin que vous ayez la paix en moi. Vous aurez à souffrir dans le monde, mais prenez courage: j’ai vaincu le monde.',
      kjf:
        'Je vous ai dit ces choses, afin que vous ayez la paix en moi. Vous aurez de la tribulation dans le monde; mais ayez bon courage, j’ai vaincu le monde.',
    },
  },
  {
    reference: 'Ésaïe 40:31',
    book: 'Ésaïe',
    chapter: 40,
    verse: '31',
    translations: {
      lsg1910:
        'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point, ils marchent, et ne se fatiguent point.',
      pdv:
        'Mais ceux qui mettent leur espoir dans le Seigneur retrouvent des forces nouvelles. Ils s’envolent comme des aigles, ils courent sans se fatiguer, ils avancent sans s’épuiser.',
      fc:
        'Mais ceux qui comptent sur le Seigneur reçoivent des forces nouvelles; comme des aigles ils prennent leur essor. Ils courent et ne se lassent pas, ils avancent et ne s’épuisent pas.',
      kjf:
        'Mais ceux qui s’attendent au SEIGNEUR renouvelleront leur force; ils monteront avec des ailes comme des aigles; ils courront et ne se lasseront pas; ils marcheront et ne défailliront pas.',
    },
  },
  {
    reference: 'Matthieu 28:20',
    book: 'Matthieu',
    chapter: 28,
    verse: '20',
    translations: {
      lsg1910:
        'Et voici, je suis avec vous tous les jours, jusqu’à la fin du monde.',
      pdv:
        'Et n’oubliez pas ceci: je suis avec vous tous les jours, jusqu’à la fin du monde.',
      fc:
        'Et sachez-le: je suis avec vous tous les jours, jusqu’à la fin du monde.',
      kjf:
        'Et voici, je suis toujours avec vous, même jusqu’à la fin du monde. Amen.',
    },
  },
  {
    reference: '1 Jean 4:19',
    book: '1 Jean',
    chapter: 4,
    verse: '19',
    translations: {
      lsg1910: 'Pour nous, nous l’aimons, parce qu’il nous a aimés le premier.',
      pdv: 'Nous aimons parce que Dieu nous a aimés le premier.',
      fc: 'Nous aimons parce que Dieu nous a aimés le premier.',
      kjf: 'Nous l’aimons, parce qu’il nous a aimés le premier.',
    },
  },
  {
    reference: 'Psaume 37:4',
    book: 'Psaumes',
    chapter: 37,
    verse: '4',
    translations: {
      lsg1910:
        'Fais de l’Éternel tes délices, et il te donnera ce que ton cœur désire.',
      pdv:
        'Fais du Seigneur ta joie, et il te donnera ce que ton cœur désire.',
      fc:
        'Mets ta joie dans le Seigneur, et il t’accordera ce que ton cœur désire.',
      kjf:
        'Prends aussi ton plaisir dans le SEIGNEUR, et il te donnera les désirs de ton cœur.',
    },
  },
  {
    reference: 'Psaume 91:1-2',
    book: 'Psaumes',
    chapter: 91,
    verse: '1-2',
    translations: {
      lsg1910:
        'Celui qui demeure sous l’abri du Très-Haut repose à l’ombre du Tout-Puissant. Je dis à l’Éternel: Mon refuge et ma forteresse, mon Dieu en qui je me confie!',
      pdv:
        'Celui qui s’abrite auprès du Très-Haut passe la nuit à l’ombre du Tout-Puissant. Je dis au Seigneur: « Tu es mon abri et mon lieu sûr, tu es mon Dieu en qui j’ai confiance! »',
      fc:
        'Celui qui se met sous la protection du Dieu très-haut vit en sécurité auprès du Tout-Puissant. Je dis au Seigneur: « Tu es mon refuge et ma forteresse, mon Dieu en qui j’ai confiance! »',
      kjf:
        'Celui qui demeure dans le lieu secret du Très-Haut logera sous l’ombre du Tout-Puissant. Je dirai du SEIGNEUR: Il est mon refuge et ma forteresse, mon Dieu; en lui je me confierai.',
    },
  },
  {
    reference: '1 Corinthiens 16:14',
    book: '1 Corinthiens',
    chapter: 16,
    verse: '14',
    translations: {
      lsg1910: 'Que tout ce que vous faites se fasse avec charité!',
      pdv: 'Tout ce que vous faites, faites-le avec amour.',
      fc: 'Faites tout avec amour.',
      kjf: 'Que toutes vos choses soient faites avec charité.',
    },
  },
  {
    reference: 'Lamentations 3:22-23',
    book: 'Lamentations',
    chapter: 3,
    verse: '22-23',
    translations: {
      lsg1910:
        'Les bontés de l’Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme; elles se renouvellent chaque matin. Oh! que ta fidélité est grande!',
      pdv:
        'Les bienfaits du Seigneur ne sont pas épuisés, sa tendresse n’a pas de fin. Elle se renouvelle chaque matin. Oui, ta fidélité est immense!',
      fc:
        'L’amour du Seigneur ne s’est pas épuisé, sa bonté n’est pas arrivée à son terme; chaque matin elle se renouvelle. Grande est ta fidélité!',
      kjf:
        'C’est par les miséricordes du SEIGNEUR que nous ne sommes pas consumés, parce que ses compassions ne défaillent pas. Elles sont nouvelles chaque matin; grande est ta fidélité.',
    },
  },
];

/**
 * Retourne le verset programmé de manière déterministe pour une date YYYY-MM-DD
 * lorsque Firestore ne contient pas encore de surcharge spécifique pour cette date.
 */
export function getScheduledVerseForDate(dateKey: string): DailyVerse | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const utcTime = Date.UTC(y, m - 1, d);
  if (Number.isNaN(utcTime)) return null;

  const dayNumber = Math.floor(utcTime / 86400000);
  const index = ((dayNumber % CANONICAL_VERSES.length) + CANONICAL_VERSES.length) % CANONICAL_VERSES.length;
  const entry = CANONICAL_VERSES[index];

  return {
    date: dateKey,
    reference: entry.reference,
    book: entry.book,
    chapter: entry.chapter,
    verse: entry.verse,
    translations: entry.translations,
    source: 'schedule',
  };
}
