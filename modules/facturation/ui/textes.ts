/**
 * Libellés de l'interface, relevés **tels quels** dans `Zemzem Asfar.dc.html`.
 *
 * Rien n'est traduit, reformulé ni ajouté ici : chaque chaîne est celle du
 * fichier de référence. Ce catalogue existe pour que la conformité soit
 * vérifiable d'un coup d'œil, et pour qu'aucun texte ne soit inventé dans les
 * composants.
 *
 * Langue et orientation par écran, telles qu'elles figurent dans le fichier :
 *
 * | Écran / fenêtre        | Langue   | Direction |
 * |------------------------|----------|-----------|
 * | Connexion              | arabe    | RTL       |
 * | Registre des reçus     | arabe    | RTL       |
 * | Reçu (aperçu papier)   | arabe    | RTL       |
 * | Statistiques           | arabe    | RTL       |
 * | Fenêtres du lot L2     | arabe    | RTL       |
 * | Journal financier      | arabe    | RTL       | (lot L4)
 * | Suivi journalier       | français | LTR       | (lot L5)
 * | Chèques et virements   | français | LTR       | (lot L5)
 *
 * Les écrans français du fichier — suivi journalier, registre des chèques et
 * les fenêtres qui en dépendent — restent en français lorsqu'ils seront
 * construits. Ils ne sont pas concernés par ce lot.
 */

export const T = {
  marque: {
    nom: 'زمزم أسفار',
    sousTitre: 'تدبير العمرة',
  },

  connexion: {
    utilisateur: 'اسم المستخدم',
    motDePasse: 'كلمة المرور',
    entrer: 'دخول',
    aideEssai: 'للتجربة:',
    erreur: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  },

  saisonActive: (nom: string) => `الموسم النشط — ${nom}`,

  navigation: {
    recu: 'الوصل',
    finance: 'المالية',
    statistiques: 'الإحصائيات',
    journal: 'السجل',
    sortie: 'خروج',
    modeNuit: 'الوضع الليلي',
    modeJour: 'الوضع النهاري',
  },

  registre: {
    nouveauRecu: 'وصل جديد',
    ajouterDfp: 'إضافة دفعة',
    rechercheNom: 'الاسم',
    rechercheNumero: 'رقم الوصل',
    rechercher: 'بحث…',
    videTitre: 'لا يوجد أي وصل مطابق',
    videAide: 'غيّر الاسم أو رقم الوصل في خانة البحث',
    afficherAnnules: 'إظهار الملغاة',
    sousTitre: (actifs: number, annules: number) => `${actifs} وصل نشط · ${annules} ملغى`,
    /** Ordre exact des colonnes du fichier de référence. */
    colonnes: {
      numero: 'رقم',
      nom: 'الاسم / النسب',
      convenu: 'المبلغ المتفق عليه',
      paye: 'مجموع الدفعات',
      restant: 'الباقي',
      date: 'تاريخ التسجيل',
      nbVersements: 'عدد الدفعات',
      derniereDfp: 'آخر دفعة',
      methode: 'الطريقة',
      statut: 'الحالة',
      hotel: 'الفندق',
      chambre: 'الغرفة',
      vol: 'الرحلة',
      rabatteur: 'الوسيط',
      note: 'ملاحظة',
      employe: 'الموظف',
      reduction: 'التخفيض',
      telephone: 'رقم الهاتف',
      groupe: 'المجموعة',
      actions: 'الإجراءات',
    },
    infobulleLigne: 'انقر مرتين لعرض الملف الكامل',
    actionAnnuler: 'إلغاء / حذف الوصل',
    actionModifier: 'تعديل',
    actionDfp: 'إضافة دفعة',
    actionVoir: 'عرض الوصل',
  },

  recu: {
    retour: 'رجوع',
  },

  statuts: {
    solde: 'مسدد',
    incomplet: 'غير مكتمل',
    annule: 'ملغى',
  },

  methodes: {
    especes: 'نقد',
    cheque: 'شيك',
    virement: 'تحويل',
  },

  statistiques: {
    cartes: [
      { titre: 'إحصائيات عامة', sousTitre: 'المسافرون، الوصولات، الحالات' },
      { titre: 'المدفوعات والصندوق', sousTitre: 'المبالغ، طرق الدفع، الباقي' },
      { titre: 'الفنادق والرحلات', sousTitre: 'التوزيع حسب البرنامج' },
      { titre: 'الموظفون', sousTitre: 'النشاط والصلاحيات — للإدارة فقط لاحقًا' },
    ],
    etiquette: 'مرحلة لاحقة',
    note: 'تم حجز الصفحة دون إضافة حسابات أو رسوم الآن، حتى لا تتأثر الفوترة.',
  },

  nouveau: {
    titre: 'وصل جديد',
    numero: 'رقم',
    erreurs: 'يجب إكمال ما يلي:',
    sectionVoyageur: 'المسافر',
    passeportLie: '✓ تم ربط جواز السفر',
    scannerPasseport: 'مسح جواز السفر',
    numeroPasseport: 'رقم الجواز:',
    prenom: 'الاسم *',
    nom: 'النسب *',
    telephone: 'رقم الهاتف *',
    hotel: 'الفندق *',
    vol: 'الرحلة *',
    chambre: 'الغرفة *',
    rabatteur: 'الوسيط *',
    reduction: 'التخفيض (درهم)',
    sansPrix: 'لا يوجد ثمن محدّد لهذا الاختيار في هذا الموسم.',
    groupeCoche: 'ينتمي إلى مجموعة / عائلة',
    groupeCode: 'رمز المجموعة',
    sectionPremiereDfp: 'الدفعة الأولى — إجبارية',
    montant: 'المبلغ المدفوع *',
    methode: 'طريقة الدفع *',
    note: 'ملاحظة',
    annuler: 'إلغاء',
    enregistrer: 'حفظ الوصل',
    choisir: 'اختر…',
  },

  instrument: {
    dansLaMemeFenetre: 'داخل نفس النافذة',
    operationUnique: 'عملية فردية',
    operationPartagee: 'عملية مشتركة',
    creerOperation: 'إنشاء عملية جديدة',
    choisirOperation: 'اختيار عملية موجودة',
    operationsDisponibles: 'العمليات المشتركة المتاحة *',
    choisirOperationVide: 'اختر العملية…',
    aucuneOperation: 'لا توجد عملية مشتركة متاحة بهذه الطريقة. أنشئ عملية جديدة أولاً.',
    reference: 'رقم الشيك أو مرجع التحويل *',
    dateOperation: 'تاريخ العملية *',
    banque: 'البنك *',
    payeur: 'الشخص الذي قام بالدفع *',
    montantOperation: 'المبلغ الحقيقي للعملية *',
    partDeCeVoyageur: 'المبلغ المدفوع هنا هو حصة هذا المسافر',
    montantDistribue: 'المبلغ الموزع',
    restantDisponible: 'المتبقي المتاح',
    uneSeuleImage: 'صورة واحدة فقط لكل عملية',
    imageDepuisRegistre:
      'هذه العملية مسجلة مسبقًا. تضاف الصورة لاحقًا من سجل المدفوعات، وليس من وصل هذا العميل.',
  },

  versement: {
    titre: 'إضافة دفعة',
    numeroRecu: 'رقم الوصل *',
    aideNumero: 'اكتب رقم الوصل مباشرة',
    montant: 'المبلغ *',
    payeAvant: 'المدفوع سابقًا',
    restantApres: 'الباقي بعد هذه الدفعة',
    recap: 'ملخص الدفعات الست',
    recapAide: 'للقراءة والمعاينة فقط',
    detailsInstrument: 'تفاصيل الشيك / التحويل',
    enregistrer: 'حفظ الدفعة',
    annuler: 'إلغاء',
    introuvable: 'هذا الرقم غير موجود.',
    annule: 'هذا الوصل ملغى — لا يمكن إضافة دفعة.',
    solde: 'هذا الوصل مسدد بالكامل — لا يمكن إضافة دفعة.',
    colonnes: {
      rang: '#',
      date: 'التاريخ',
      montant: 'المبلغ',
      methode: 'الطريقة',
      details: 'المرجع',
    },
  },

  annulation: {
    titre: 'إلغاء الوصل',
    avertissement:
      'الوصل لا يُحذف أبدًا. اختر فقط هل الاسترجاع يخرج من الصندوق أم يُدار خارجه.',
    montantPaye: 'المبلغ المدفوع',
    modeRemboursement: 'طريقة الاسترجاع *',
    choisir: 'اختر',
    depuisCaisse: 'من الصندوق',
    horsCaisse: 'خارج الصندوق',
    motif: 'سبب الإلغاء *',
    motDePasse: 'كلمة المرور *',
    retour: 'تراجع',
    confirmer: 'تأكيد الإلغاء',
  },

  modification: {
    titre: 'تعديل بيانات الوصل',
    consigne:
      'اختر قسمًا واحدًا فقط. بعد حفظه يمكنك فتح التعديل مرة أخرى لاختيار قسم آخر.',
    fixes: 'الوسيط ومبالغ الدفعات غير قابلة للتعديل. الدفعات الثانية وما بعدها تبقى كما سُجلت.',
    sectionChoisie: 'القسم المختار',
    retour: '←',
    motif: 'سبب التعديل *',
    enregistrer: 'حفظ التعديل',
    erreur: 'تعذر حفظ التعديل:',
    sections: {
      identity: { titre: 'الهوية', sousTitre: 'الاسم والنسب معًا' },
      contact: { titre: 'الهاتف', sousTitre: 'رقم الهاتف فقط' },
      program: { titre: 'البرنامج والسعر', sousTitre: 'الفندق، الرحلة، الغرفة والتخفيض' },
      group: { titre: 'المجموعة / العائلة', sousTitre: 'إضافة، تغيير أو حذف المجموعة' },
      note: { titre: 'الملاحظة', sousTitre: 'تعديل الملاحظة فقط' },
      firstPayment: {
        titre: 'طريقة الدفعة الأولى',
        sousTitre: 'الطريقة وبيانات الشيك أو التحويل، دون تغيير المبلغ',
      },
    },
    premiereDfpFixe: 'مبلغ الدفعة الأولى — لا يتغير',
    nouveauPrix: 'الثمن الجديد',
    nouveauConvenu: 'المبلغ المتفق عليه الجديد',
    montantInchange: 'المبلغ المدفوع يبقى كما هو',
    portePartagee:
      'بيانات العملية المشتركة تعدّل من سجل المدفوعات والتحويلات، وليس من الوصل.',
    noteFirstPayment:
      'هذا التعديل يخص طريقة وبيانات الدفعة الأولى فقط. مبلغها والدفعات التالية لا تتغير.',
  },

  passeport: {
    titre: 'مسح جواز السفر',
    sousTitre: 'محاكاة وظيفية للربط المستقبلي مع خدمة الذكاء الاصطناعي',
    prenom: 'الاسم',
    nom: 'النسب',
    numero: 'رقم الجواز',
    nationalite: 'الجنسية',
    naissance: 'تاريخ الميلاد',
    lieuNaissance: 'مكان الميلاد',
    emission: 'تاريخ الإصدار',
    expiration: 'تاريخ الانتهاء',
    paysEmission: 'بلد الإصدار',
    sexe: 'الجنس',
    mrz: 'منطقة MRZ / النتيجة الخام',
    utiliser: 'استعمال البيانات في الوصل',
    annuler: 'إلغاء',
    manqueNom: 'الاسم والنسب ضروريان لاستعمال نتيجة المسح.',
    sauvegardeInfo: 'سيتم حفظ الصورة الأصلية وجميع البيانات عند حفظ الوصل.',
  },

  detail: {
    titre: 'الملف الكامل للمسافر',
    nonModifie: 'غير معدل',
    modifieNFois: (n: number) => `تم التعديل ${n} مرة`,
    prixOrigine: 'الثمن الأصلي',
    convenu: 'المتفق عليه',
    paye: 'مجموع الدفعات',
    restant: 'الباقي',
    identiteContact: 'الهوية والاتصال',
    passeport: 'الجواز',
    telephone: 'الهاتف',
    note: 'الملاحظة',
    programme: 'البرنامج',
    saison: 'الموسم',
    infosEnregistrement: 'معلومات التسجيل',
    impression: 'الطباعة',
    derniereModification: 'آخر تعديل',
    modifiePar: 'عدل بواسطة',
    dfpEnregistrees: 'الدفعات المسجلة',
    journalModifications: 'سجل التعديلات',
    motifPrefixe: 'السبب:',
    infosAnnulation: 'معلومات الإلغاء',
    motif: 'السبب',
    annulePar: 'ألغاه',
    dateAnnulation: 'تاريخ الإلغاء',
    voirRecu: 'عرض الوصل / الطباعة',
    fermer: 'إغلاق',
    hotel: 'الفندق',
    chambre: 'الغرفة',
    vol: 'الرحلة',
    rabatteur: 'الوسيط',
    employe: 'الموظف',
    groupe: 'المجموعة',
    colonnes: {
      rang: '#',
      date: 'التاريخ',
      montant: 'المبلغ',
      document: 'الوثيقة',
      reference: 'المرجع',
      dateInstrument: 'تاريخه',
      banque: 'البنك',
      payeur: 'الدافع',
      montantOperation: 'قيمة العملية',
    },
  },

  journal: {
    titre: 'سجل العمليات',
    vide: 'لا توجد عمليات.',
  },

  depassement: {
    titre: 'تجاوز المبلغ المتبقي للعملية',
    consigne: 'التسجيل ممكن، لكنه يحتاج تأكيدًا صريحًا.',
    partAvant: 'الحصة المراد تسجيلها هي',
    partApres: '، بينما المتبقي في العملية المشتركة هو',
    conservation:
      'سيتم الاحتفاظ بهذه المخالفة في بيانات العملية. لا توجد أي مراقبة تلقائية للعمليات المكررة.',
    confirmer: 'تأكيد وحفظ',
    retour: 'إلغاء',
  },
} as const
