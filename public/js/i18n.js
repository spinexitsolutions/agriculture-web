/* Interface strings in English, Hindi, Marathi and Tamil.
   Content written in the CMS is translated in the admin (stored as `_t` on each item). */
(function (g) {
  const LANGS = { en: 'English', hi: 'हिन्दी', mr: 'मराठी', ta: 'தமிழ்' };

  const S = {
    en: {
      getInTouch: 'Get in touch', cart: 'Cart', account: 'Account', menu: 'Menu', language: 'Language',
      learnMore: 'Learn more', readMore: 'Read more', viewAll: 'View all', back: 'Back', home: 'Home', loading: 'Loading…',
      submit: 'Submit', sending: 'Sending…', search: 'Search', all: 'All', noResults: 'Nothing found.',
      notFound: 'Page not found.', notFoundText: 'The page you’re looking for has moved or never existed.', goHome: 'Go to homepage',
      formThanks: 'Thank you! Our team will call you within one working day.', previewForms: 'Forms are disabled in preview mode.',
      // shop
      shop: 'Shop', shopTitle: 'The harvest. *Fresh this week.*', shopSub: 'Grown without synthetic pesticides, harvested to order.',
      addToCart: 'Add to cart', added: 'Added to cart', buyNow: 'Buy now', outOfStock: 'Out of stock', inStock: 'In stock', onlyLeft: 'Only {n} left',
      mrp: 'MRP', off: '{n}% off', qty: 'Quantity', yourCart: 'Your cart', emptyCart: 'Your cart is empty.', continueShopping: 'Continue shopping',
      subtotal: 'Subtotal', delivery: 'Delivery', free: 'Free', total: 'Total', checkout: 'Checkout', placeOrder: 'Place order', payNow: 'Pay {amt}',
      cod: 'Cash on delivery', online: 'UPI / Card / Netbanking', payment: 'Payment', pincode: 'Pincode', check: 'Check',
      deliversIn: 'Delivers in {d}', notServiceable: 'Not deliverable to this pincode yet.', checkDelivery: 'Check delivery',
      contactDetails: 'Contact details', deliveryAddress: 'Delivery address', name: 'Full name', phone: 'Mobile number', email: 'Email',
      address1: 'House / street / area', address2: 'Landmark (optional)', city: 'City / village', state: 'State', orderNote: 'Note for us (optional)',
      orderPlaced: 'Thank you! Your order is placed.', orderNumber: 'Order number', trackOrder: 'Track order', trackTitle: 'Track your order', track: 'Track',
      orderStatus: 'Order status', minOrder: 'Minimum order is {amt}.', freeAbove: 'Free delivery above {amt}', addMore: 'Add {amt} more for free delivery',
      related: 'You may also like', description: 'Details', searchProducts: 'Search produce', sortFeatured: 'Featured', sortLow: 'Price: low to high', sortHigh: 'Price: high to low',
      remove: 'Remove', items: 'Items', paymentFailed: 'Payment was not completed. You can try again from your order page.', retryPayment: 'Complete payment',
      st_pending_payment: 'Awaiting payment', st_placed: 'Order placed', st_confirmed: 'Confirmed', st_packed: 'Packed', st_shipped: 'Shipped', st_delivered: 'Delivered', st_cancelled: 'Cancelled',
      // account
      signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out', password: 'Password', yourOrders: 'Your orders', noOrders: 'No orders yet.',
      welcomeBack: 'Welcome back', newHere: 'New here?', haveAccount: 'Already have an account?', hello: 'Hello, {name}',
      // farmers
      farmerForms: 'How can we help?', register: 'Join the programme', soilTest: 'Book a soil test', callback: 'Request a call-back',
      village: 'Village', district: 'District', land: 'Land (acres)', crops: 'Main crops', preferredDate: 'Preferred date', preferredTime: 'Best time to call',
      topic: 'Topic', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', message: 'Message', language_pref: 'Preferred language',
      // careers
      openRoles: 'Open roles', apply: 'Apply', applyFor: 'Apply for this role', resume: 'Link to your CV (Google Drive, LinkedIn…)', coverNote: 'Why do you want to join?', noRoles: 'No open roles right now — but do write to us.', role: 'Role',
      // bulk
      bulkTitle: 'Bulk & business supply', bulkSub: 'Contract-grown produce for restaurants, retailers and exporters.', company: 'Company', productsNeeded: 'Products needed', quantity: 'Quantity per order', frequency: 'How often?', weekly: 'Weekly', monthly: 'Monthly', oneTime: 'One time', requestQuote: 'Request a quote',
      // mandi
      mandiTitle: 'Mandi prices *today.*', mandiSub: 'Live prices from APMC mandis, updated daily from data.gov.in.', commodity: 'Commodity', market: 'Market',
      minPrice: 'Min', maxPrice: 'Max', modalPrice: 'Modal', perQuintal: '₹ per quintal', updated: 'Prices for {d}', source: 'Source: Agmarknet / data.gov.in. Always confirm at your mandi before selling.',
      mandiOff: 'Mandi prices are not set up yet.', mandiErr: 'Mandi prices are unavailable right now. Please try again later.', allDistricts: 'All districts', searchCommodity: 'Search commodity (e.g. Onion)',
      // advisory
      advisoryTitle: 'Grow smarter, *season by season.*', advisorySub: 'Crop calendar, field advisories and government schemes — in one place.',
      calendar: 'Crop calendar', advisories: 'Advisories', schemes: 'Government schemes', sowing: 'Sowing', harvest: 'Harvest', season: 'Season', eligibility: 'Who can apply', visitPortal: 'Official portal', schemeNote: 'Rules change — always confirm on the official portal.',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      // blog
      journal: 'Journal', journalTitle: 'Notes from the *field.*', searchPosts: 'Search articles', by: 'By {a}', minRead: '{n} min read', allPosts: 'All articles', morePosts: 'More from the journal',
      // contact
      contactTitle: 'Say *hello.*', sendMessage: 'Send message', subscribe: 'Subscribe', subscribed: 'You’re subscribed.', emailAddress: 'Email address',
      topicBuying: 'Buying produce', topicFarmer: 'Joining as a farmer', topicBulk: 'Bulk / business supply', topicPartner: 'Partnership', topicOther: 'Something else',
      msgThanks: 'Thanks. We’ll reply within a day.', fillRequired: 'Please fill in the required fields.',
      // footer
      fShop: 'Shop', fFarmers: 'For farmers', fCompany: 'Company', fLegal: 'Legal', fContact: 'Contact', allProducts: 'All produce', bulk: 'Bulk orders', team: 'Our team',
    },

    hi: {
      getInTouch: 'संपर्क करें', cart: 'कार्ट', account: 'खाता', menu: 'मेन्यू', language: 'भाषा',
      learnMore: 'और जानें', readMore: 'आगे पढ़ें', viewAll: 'सभी देखें', back: 'वापस', home: 'होम', loading: 'लोड हो रहा है…',
      submit: 'भेजें', sending: 'भेजा जा रहा है…', search: 'खोजें', all: 'सभी', noResults: 'कुछ नहीं मिला।',
      notFound: 'पेज नहीं मिला।', notFoundText: 'आप जो पेज ढूंढ रहे हैं वह हट गया है या मौजूद नहीं है।', goHome: 'होमपेज पर जाएं',
      formThanks: 'धन्यवाद! हमारी टीम एक कार्य दिवस में आपको कॉल करेगी।', previewForms: 'प्रीव्यू मोड में फ़ॉर्म बंद हैं।',
      shop: 'दुकान', shopTitle: 'ताज़ी फसल, *इसी हफ़्ते की।*', shopSub: 'बिना रासायनिक कीटनाशक के उगाई, ऑर्डर पर तोड़ी गई।',
      addToCart: 'कार्ट में डालें', added: 'कार्ट में जुड़ गया', buyNow: 'अभी खरीदें', outOfStock: 'स्टॉक में नहीं', inStock: 'स्टॉक में', onlyLeft: 'सिर्फ़ {n} बचे',
      mrp: 'एमआरपी', off: '{n}% छूट', qty: 'मात्रा', yourCart: 'आपका कार्ट', emptyCart: 'आपका कार्ट खाली है।', continueShopping: 'खरीदारी जारी रखें',
      subtotal: 'उप-योग', delivery: 'डिलीवरी', free: 'मुफ़्त', total: 'कुल', checkout: 'चेकआउट', placeOrder: 'ऑर्डर करें', payNow: '{amt} भुगतान करें',
      cod: 'डिलीवरी पर नकद', online: 'UPI / कार्ड / नेटबैंकिंग', payment: 'भुगतान', pincode: 'पिनकोड', check: 'जांचें',
      deliversIn: '{d} में डिलीवरी', notServiceable: 'इस पिनकोड पर अभी डिलीवरी नहीं है।', checkDelivery: 'डिलीवरी जांचें',
      contactDetails: 'संपर्क जानकारी', deliveryAddress: 'डिलीवरी का पता', name: 'पूरा नाम', phone: 'मोबाइल नंबर', email: 'ईमेल',
      address1: 'मकान / गली / इलाका', address2: 'लैंडमार्क (वैकल्पिक)', city: 'शहर / गाँव', state: 'राज्य', orderNote: 'हमारे लिए नोट (वैकल्पिक)',
      orderPlaced: 'धन्यवाद! आपका ऑर्डर हो गया।', orderNumber: 'ऑर्डर नंबर', trackOrder: 'ऑर्डर ट्रैक करें', trackTitle: 'अपना ऑर्डर ट्रैक करें', track: 'ट्रैक करें',
      orderStatus: 'ऑर्डर की स्थिति', minOrder: 'न्यूनतम ऑर्डर {amt} है।', freeAbove: '{amt} से ऊपर मुफ़्त डिलीवरी', addMore: 'मुफ़्त डिलीवरी के लिए {amt} और जोड़ें',
      related: 'ये भी पसंद आ सकते हैं', description: 'विवरण', searchProducts: 'उपज खोजें', sortFeatured: 'खास', sortLow: 'कीमत: कम से ज़्यादा', sortHigh: 'कीमत: ज़्यादा से कम',
      remove: 'हटाएं', items: 'सामान', paymentFailed: 'भुगतान पूरा नहीं हुआ। आप ऑर्डर पेज से दोबारा कोशिश कर सकते हैं।', retryPayment: 'भुगतान पूरा करें',
      st_pending_payment: 'भुगतान बाकी', st_placed: 'ऑर्डर हुआ', st_confirmed: 'पुष्टि हुई', st_packed: 'पैक हुआ', st_shipped: 'रवाना हुआ', st_delivered: 'पहुंच गया', st_cancelled: 'रद्द',
      signIn: 'साइन इन', signUp: 'खाता बनाएं', signOut: 'साइन आउट', password: 'पासवर्ड', yourOrders: 'आपके ऑर्डर', noOrders: 'अभी कोई ऑर्डर नहीं।',
      welcomeBack: 'फिर से स्वागत है', newHere: 'नए हैं?', haveAccount: 'पहले से खाता है?', hello: 'नमस्ते, {name}',
      farmerForms: 'हम आपकी कैसे मदद करें?', register: 'कार्यक्रम से जुड़ें', soilTest: 'मिट्टी जांच बुक करें', callback: 'कॉल-बैक मांगें',
      village: 'गाँव', district: 'ज़िला', land: 'ज़मीन (एकड़)', crops: 'मुख्य फसलें', preferredDate: 'पसंदीदा तारीख', preferredTime: 'कॉल का सही समय',
      topic: 'विषय', morning: 'सुबह', afternoon: 'दोपहर', evening: 'शाम', message: 'संदेश', language_pref: 'पसंदीदा भाषा',
      openRoles: 'खुली नौकरियां', apply: 'आवेदन करें', applyFor: 'इस पद के लिए आवेदन करें', resume: 'आपके CV का लिंक', coverNote: 'आप क्यों जुड़ना चाहते हैं?', noRoles: 'अभी कोई पद खाली नहीं है — फिर भी हमें लिखें।', role: 'पद',
      bulkTitle: 'थोक और व्यापारिक सप्लाई', bulkSub: 'रेस्टोरेंट, रिटेलर और निर्यातकों के लिए अनुबंध पर उगाई गई उपज।', company: 'कंपनी', productsNeeded: 'ज़रूरी उत्पाद', quantity: 'हर ऑर्डर की मात्रा', frequency: 'कितनी बार?', weekly: 'हर हफ़्ते', monthly: 'हर महीने', oneTime: 'एक बार', requestQuote: 'कोटेशन मांगें',
      mandiTitle: 'आज के *मंडी भाव।*', mandiSub: 'APMC मंडियों के ताज़ा भाव, data.gov.in से रोज़ अपडेट।', commodity: 'फसल', market: 'मंडी',
      minPrice: 'न्यूनतम', maxPrice: 'अधिकतम', modalPrice: 'मॉडल', perQuintal: '₹ प्रति क्विंटल', updated: '{d} के भाव', source: 'स्रोत: एगमार्कनेट / data.gov.in. बेचने से पहले अपनी मंडी में भाव ज़रूर पुष्टि करें।',
      mandiOff: 'मंडी भाव अभी सेट नहीं हैं।', mandiErr: 'मंडी भाव अभी उपलब्ध नहीं हैं। कृपया बाद में कोशिश करें।', allDistricts: 'सभी ज़िले', searchCommodity: 'फसल खोजें (जैसे प्याज़)',
      advisoryTitle: 'हर मौसम में, *समझदारी से खेती।*', advisorySub: 'फसल कैलेंडर, खेती सलाह और सरकारी योजनाएं — एक जगह।',
      calendar: 'फसल कैलेंडर', advisories: 'सलाह', schemes: 'सरकारी योजनाएं', sowing: 'बुवाई', harvest: 'कटाई', season: 'मौसम', eligibility: 'कौन आवेदन कर सकता है', visitPortal: 'आधिकारिक पोर्टल', schemeNote: 'नियम बदलते रहते हैं — आधिकारिक पोर्टल पर ज़रूर जांचें।',
      months: ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'],
      journal: 'ब्लॉग', journalTitle: 'खेत से *कहानियां।*', searchPosts: 'लेख खोजें', by: '{a} द्वारा', minRead: '{n} मिनट', allPosts: 'सभी लेख', morePosts: 'और लेख',
      contactTitle: '*नमस्ते* कहें।', sendMessage: 'संदेश भेजें', subscribe: 'सब्सक्राइब', subscribed: 'आप सब्सक्राइब हो गए।', emailAddress: 'ईमेल पता',
      topicBuying: 'उपज खरीदना', topicFarmer: 'किसान के रूप में जुड़ना', topicBulk: 'थोक / व्यापारिक सप्लाई', topicPartner: 'साझेदारी', topicOther: 'कुछ और',
      msgThanks: 'धन्यवाद। हम एक दिन में जवाब देंगे।', fillRequired: 'कृपया ज़रूरी जानकारी भरें।',
      fShop: 'दुकान', fFarmers: 'किसानों के लिए', fCompany: 'कंपनी', fLegal: 'कानूनी', fContact: 'संपर्क', allProducts: 'सारी उपज', bulk: 'थोक ऑर्डर', team: 'हमारी टीम',
    },

    mr: {
      getInTouch: 'संपर्क करा', cart: 'कार्ट', account: 'खाते', menu: 'मेनू', language: 'भाषा',
      learnMore: 'अधिक जाणून घ्या', readMore: 'पुढे वाचा', viewAll: 'सर्व पहा', back: 'मागे', home: 'होम', loading: 'लोड होत आहे…',
      submit: 'पाठवा', sending: 'पाठवत आहे…', search: 'शोधा', all: 'सर्व', noResults: 'काहीही सापडले नाही.',
      notFound: 'पान सापडले नाही.', notFoundText: 'तुम्ही शोधत असलेले पान हलवले आहे किंवा अस्तित्वात नाही.', goHome: 'मुख्यपृष्ठावर जा',
      formThanks: 'धन्यवाद! आमची टीम एका कामकाजाच्या दिवसात तुम्हाला फोन करेल.', previewForms: 'प्रीव्ह्यू मोडमध्ये फॉर्म बंद आहेत.',
      shop: 'दुकान', shopTitle: 'ताजे पीक, *याच आठवड्याचे.*', shopSub: 'रासायनिक कीटकनाशकांशिवाय पिकवलेले, ऑर्डरनुसार काढलेले.',
      addToCart: 'कार्टमध्ये टाका', added: 'कार्टमध्ये जोडले', buyNow: 'आता खरेदी करा', outOfStock: 'स्टॉक संपला', inStock: 'स्टॉकमध्ये', onlyLeft: 'फक्त {n} शिल्लक',
      mrp: 'एमआरपी', off: '{n}% सूट', qty: 'प्रमाण', yourCart: 'तुमचे कार्ट', emptyCart: 'तुमचे कार्ट रिकामे आहे.', continueShopping: 'खरेदी सुरू ठेवा',
      subtotal: 'उप-एकूण', delivery: 'डिलिव्हरी', free: 'मोफत', total: 'एकूण', checkout: 'चेकआउट', placeOrder: 'ऑर्डर द्या', payNow: '{amt} भरा',
      cod: 'डिलिव्हरीवेळी रोख', online: 'UPI / कार्ड / नेटबँकिंग', payment: 'पेमेंट', pincode: 'पिनकोड', check: 'तपासा',
      deliversIn: '{d} मध्ये डिलिव्हरी', notServiceable: 'या पिनकोडवर अजून डिलिव्हरी नाही.', checkDelivery: 'डिलिव्हरी तपासा',
      contactDetails: 'संपर्क माहिती', deliveryAddress: 'डिलिव्हरीचा पत्ता', name: 'पूर्ण नाव', phone: 'मोबाइल नंबर', email: 'ईमेल',
      address1: 'घर / गल्ली / परिसर', address2: 'खूण (ऐच्छिक)', city: 'शहर / गाव', state: 'राज्य', orderNote: 'आमच्यासाठी टीप (ऐच्छिक)',
      orderPlaced: 'धन्यवाद! तुमची ऑर्डर झाली.', orderNumber: 'ऑर्डर क्रमांक', trackOrder: 'ऑर्डर ट्रॅक करा', trackTitle: 'तुमची ऑर्डर ट्रॅक करा', track: 'ट्रॅक करा',
      orderStatus: 'ऑर्डरची स्थिती', minOrder: 'किमान ऑर्डर {amt} आहे.', freeAbove: '{amt} पेक्षा जास्त वर मोफत डिलिव्हरी', addMore: 'मोफत डिलिव्हरीसाठी आणखी {amt} जोडा',
      related: 'हेही आवडेल', description: 'तपशील', searchProducts: 'उत्पादन शोधा', sortFeatured: 'खास', sortLow: 'किंमत: कमी ते जास्त', sortHigh: 'किंमत: जास्त ते कमी',
      remove: 'काढा', items: 'वस्तू', paymentFailed: 'पेमेंट पूर्ण झाले नाही. ऑर्डर पानावरून पुन्हा प्रयत्न करा.', retryPayment: 'पेमेंट पूर्ण करा',
      st_pending_payment: 'पेमेंट बाकी', st_placed: 'ऑर्डर झाली', st_confirmed: 'निश्चित', st_packed: 'पॅक झाली', st_shipped: 'रवाना', st_delivered: 'पोहोचली', st_cancelled: 'रद्द',
      signIn: 'साइन इन', signUp: 'खाते तयार करा', signOut: 'साइन आउट', password: 'पासवर्ड', yourOrders: 'तुमच्या ऑर्डर', noOrders: 'अजून ऑर्डर नाही.',
      welcomeBack: 'पुन्हा स्वागत', newHere: 'नवीन आहात?', haveAccount: 'आधीच खाते आहे?', hello: 'नमस्कार, {name}',
      farmerForms: 'आम्ही कशी मदत करू?', register: 'कार्यक्रमात सामील व्हा', soilTest: 'माती परीक्षण बुक करा', callback: 'कॉल-बॅक मागवा',
      village: 'गाव', district: 'जिल्हा', land: 'जमीन (एकर)', crops: 'मुख्य पिके', preferredDate: 'सोयीची तारीख', preferredTime: 'फोनसाठी योग्य वेळ',
      topic: 'विषय', morning: 'सकाळ', afternoon: 'दुपार', evening: 'संध्याकाळ', message: 'संदेश', language_pref: 'पसंतीची भाषा',
      openRoles: 'उपलब्ध नोकऱ्या', apply: 'अर्ज करा', applyFor: 'या पदासाठी अर्ज करा', resume: 'तुमच्या CV ची लिंक', coverNote: 'तुम्हाला का सामील व्हायचे आहे?', noRoles: 'सध्या पद रिक्त नाही — तरीही आम्हाला लिहा.', role: 'पद',
      bulkTitle: 'घाऊक आणि व्यावसायिक पुरवठा', bulkSub: 'रेस्टॉरंट, विक्रेते आणि निर्यातदारांसाठी करारावर पिकवलेले उत्पादन.', company: 'कंपनी', productsNeeded: 'आवश्यक उत्पादने', quantity: 'प्रत्येक ऑर्डरचे प्रमाण', frequency: 'किती वेळा?', weekly: 'दर आठवड्याला', monthly: 'दर महिन्याला', oneTime: 'एकदाच', requestQuote: 'कोटेशन मागवा',
      mandiTitle: 'आजचे *बाजारभाव.*', mandiSub: 'APMC बाजारांचे ताजे भाव, data.gov.in वरून दररोज अपडेट.', commodity: 'शेतमाल', market: 'बाजार',
      minPrice: 'किमान', maxPrice: 'कमाल', modalPrice: 'सरासरी', perQuintal: '₹ प्रति क्विंटल', updated: '{d} चे भाव', source: 'स्रोत: अ‍ॅगमार्कनेट / data.gov.in. विक्रीपूर्वी बाजारात भाव निश्चित करा.',
      mandiOff: 'बाजारभाव अजून सेट केलेले नाहीत.', mandiErr: 'बाजारभाव सध्या उपलब्ध नाहीत. नंतर प्रयत्न करा.', allDistricts: 'सर्व जिल्हे', searchCommodity: 'शेतमाल शोधा (उदा. कांदा)',
      advisoryTitle: 'प्रत्येक हंगामात, *हुशारीने शेती.*', advisorySub: 'पीक दिनदर्शिका, शेती सल्ला आणि सरकारी योजना — एकाच ठिकाणी.',
      calendar: 'पीक दिनदर्शिका', advisories: 'सल्ला', schemes: 'सरकारी योजना', sowing: 'पेरणी', harvest: 'काढणी', season: 'हंगाम', eligibility: 'कोण अर्ज करू शकतो', visitPortal: 'अधिकृत पोर्टल', schemeNote: 'नियम बदलतात — अधिकृत पोर्टलवर नक्की तपासा.',
      months: ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'],
      journal: 'ब्लॉग', journalTitle: 'शेतातून *गोष्टी.*', searchPosts: 'लेख शोधा', by: '{a} यांचे', minRead: '{n} मिनिटे', allPosts: 'सर्व लेख', morePosts: 'आणखी लेख',
      contactTitle: '*नमस्कार* म्हणा.', sendMessage: 'संदेश पाठवा', subscribe: 'सबस्क्राइब', subscribed: 'तुम्ही सबस्क्राइब झालात.', emailAddress: 'ईमेल पत्ता',
      topicBuying: 'उत्पादन खरेदी', topicFarmer: 'शेतकरी म्हणून सामील होणे', topicBulk: 'घाऊक / व्यावसायिक पुरवठा', topicPartner: 'भागीदारी', topicOther: 'इतर',
      msgThanks: 'धन्यवाद. आम्ही एका दिवसात उत्तर देऊ.', fillRequired: 'कृपया आवश्यक माहिती भरा.',
      fShop: 'दुकान', fFarmers: 'शेतकऱ्यांसाठी', fCompany: 'कंपनी', fLegal: 'कायदेशीर', fContact: 'संपर्क', allProducts: 'सर्व उत्पादने', bulk: 'घाऊक ऑर्डर', team: 'आमची टीम',
    },

    ta: {
      getInTouch: 'தொடர்பு கொள்ள', cart: 'கூடை', account: 'கணக்கு', menu: 'மெனு', language: 'மொழி',
      learnMore: 'மேலும் அறிக', readMore: 'மேலும் படிக்க', viewAll: 'அனைத்தும்', back: 'பின்', home: 'முகப்பு', loading: 'ஏற்றுகிறது…',
      submit: 'அனுப்பு', sending: 'அனுப்புகிறது…', search: 'தேடு', all: 'அனைத்தும்', noResults: 'எதுவும் கிடைக்கவில்லை.',
      notFound: 'பக்கம் கிடைக்கவில்லை.', notFoundText: 'நீங்கள் தேடும் பக்கம் நகர்த்தப்பட்டது அல்லது இல்லை.', goHome: 'முகப்புக்குச் செல்',
      formThanks: 'நன்றி! எங்கள் குழு ஒரு வேலை நாளுக்குள் உங்களை அழைக்கும்.', previewForms: 'முன்னோட்டத்தில் படிவங்கள் முடக்கப்பட்டுள்ளன.',
      shop: 'கடை', shopTitle: 'புதிய அறுவடை, *இந்த வாரம்.*', shopSub: 'செயற்கை பூச்சிக்கொல்லி இல்லாமல் விளைந்தது, ஆர்டருக்கு ஏற்ப அறுவடை.',
      addToCart: 'கூடையில் சேர்', added: 'கூடையில் சேர்க்கப்பட்டது', buyNow: 'இப்போது வாங்கு', outOfStock: 'கையிருப்பில் இல்லை', inStock: 'கையிருப்பில் உள்ளது', onlyLeft: '{n} மட்டுமே உள்ளன',
      mrp: 'எம்ஆர்பி', off: '{n}% தள்ளுபடி', qty: 'அளவு', yourCart: 'உங்கள் கூடை', emptyCart: 'உங்கள் கூடை காலியாக உள்ளது.', continueShopping: 'தொடர்ந்து வாங்கு',
      subtotal: 'கூட்டுத்தொகை', delivery: 'டெலிவரி', free: 'இலவசம்', total: 'மொத்தம்', checkout: 'செக்அவுட்', placeOrder: 'ஆர்டர் செய்', payNow: '{amt} செலுத்து',
      cod: 'டெலிவரியில் பணம்', online: 'UPI / கார்டு / நெட்பேங்கிங்', payment: 'கட்டணம்', pincode: 'பின்கோடு', check: 'சரிபார்',
      deliversIn: '{d} இல் டெலிவரி', notServiceable: 'இந்த பின்கோடுக்கு இன்னும் டெலிவரி இல்லை.', checkDelivery: 'டெலிவரி சரிபார்',
      contactDetails: 'தொடர்பு விவரங்கள்', deliveryAddress: 'டெலிவரி முகவரி', name: 'முழு பெயர்', phone: 'மொபைல் எண்', email: 'மின்னஞ்சல்',
      address1: 'வீடு / தெரு / பகுதி', address2: 'அடையாளம் (விருப்பம்)', city: 'நகரம் / கிராமம்', state: 'மாநிலம்', orderNote: 'குறிப்பு (விருப்பம்)',
      orderPlaced: 'நன்றி! உங்கள் ஆர்டர் பதிவானது.', orderNumber: 'ஆர்டர் எண்', trackOrder: 'ஆர்டரைக் கண்காணி', trackTitle: 'உங்கள் ஆர்டரைக் கண்காணிக்க', track: 'கண்காணி',
      orderStatus: 'ஆர்டர் நிலை', minOrder: 'குறைந்தபட்ச ஆர்டர் {amt}.', freeAbove: '{amt}க்கு மேல் இலவச டெலிவரி', addMore: 'இலவச டெலிவரிக்கு இன்னும் {amt} சேர்க்கவும்',
      related: 'இவையும் பிடிக்கலாம்', description: 'விவரங்கள்', searchProducts: 'பொருட்களைத் தேடு', sortFeatured: 'சிறப்பு', sortLow: 'விலை: குறைவு முதல்', sortHigh: 'விலை: அதிகம் முதல்',
      remove: 'நீக்கு', items: 'பொருட்கள்', paymentFailed: 'கட்டணம் முடியவில்லை. ஆர்டர் பக்கத்தில் மீண்டும் முயலவும்.', retryPayment: 'கட்டணத்தை முடிக்கவும்',
      st_pending_payment: 'கட்டணம் நிலுவை', st_placed: 'ஆர்டர் பதிவானது', st_confirmed: 'உறுதி செய்யப்பட்டது', st_packed: 'பேக் செய்யப்பட்டது', st_shipped: 'அனுப்பப்பட்டது', st_delivered: 'சேர்க்கப்பட்டது', st_cancelled: 'ரத்து',
      signIn: 'உள்நுழை', signUp: 'கணக்கு உருவாக்கு', signOut: 'வெளியேறு', password: 'கடவுச்சொல்', yourOrders: 'உங்கள் ஆர்டர்கள்', noOrders: 'இன்னும் ஆர்டர்கள் இல்லை.',
      welcomeBack: 'மீண்டும் வருக', newHere: 'புதியவரா?', haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?', hello: 'வணக்கம், {name}',
      farmerForms: 'நாங்கள் எப்படி உதவலாம்?', register: 'திட்டத்தில் சேருங்கள்', soilTest: 'மண் பரிசோதனை பதிவு', callback: 'அழைப்பு கோரிக்கை',
      village: 'கிராமம்', district: 'மாவட்டம்', land: 'நிலம் (ஏக்கர்)', crops: 'முக்கிய பயிர்கள்', preferredDate: 'விருப்பமான தேதி', preferredTime: 'அழைக்க சரியான நேரம்',
      topic: 'தலைப்பு', morning: 'காலை', afternoon: 'மதியம்', evening: 'மாலை', message: 'செய்தி', language_pref: 'விருப்ப மொழி',
      openRoles: 'காலியிடங்கள்', apply: 'விண்ணப்பி', applyFor: 'இந்த பதவிக்கு விண்ணப்பிக்கவும்', resume: 'உங்கள் CV இணைப்பு', coverNote: 'ஏன் சேர விரும்புகிறீர்கள்?', noRoles: 'தற்போது காலியிடம் இல்லை — இருப்பினும் எழுதுங்கள்.', role: 'பதவி',
      bulkTitle: 'மொத்த மற்றும் வணிக விநியோகம்', bulkSub: 'உணவகங்கள், சில்லறை விற்பனையாளர்கள், ஏற்றுமதியாளர்களுக்கு ஒப்பந்த விளைச்சல்.', company: 'நிறுவனம்', productsNeeded: 'தேவையான பொருட்கள்', quantity: 'ஒவ்வொரு ஆர்டரின் அளவு', frequency: 'எத்தனை முறை?', weekly: 'வாராந்திரம்', monthly: 'மாதாந்திரம்', oneTime: 'ஒருமுறை', requestQuote: 'விலைப்பட்டியல் கோரு',
      mandiTitle: 'இன்றைய *சந்தை விலை.*', mandiSub: 'APMC சந்தைகளின் நேரடி விலைகள், data.gov.in இலிருந்து தினமும்.', commodity: 'பொருள்', market: 'சந்தை',
      minPrice: 'குறைந்தது', maxPrice: 'அதிகம்', modalPrice: 'சராசரி', perQuintal: '₹ / குவிண்டால்', updated: '{d} விலைகள்', source: 'ஆதாரம்: அக்மார்க்நெட் / data.gov.in. விற்கும் முன் சந்தையில் உறுதி செய்யவும்.',
      mandiOff: 'சந்தை விலை இன்னும் அமைக்கப்படவில்லை.', mandiErr: 'சந்தை விலைகள் இப்போது கிடைக்கவில்லை.', allDistricts: 'அனைத்து மாவட்டங்கள்', searchCommodity: 'பொருளைத் தேடு (எ.கா. வெங்காயம்)',
      advisoryTitle: 'ஒவ்வொரு பருவத்திலும், *புத்திசாலித்தனமாக.*', advisorySub: 'பயிர் நாட்காட்டி, ஆலோசனைகள் மற்றும் அரசுத் திட்டங்கள் — ஒரே இடத்தில்.',
      calendar: 'பயிர் நாட்காட்டி', advisories: 'ஆலோசனைகள்', schemes: 'அரசுத் திட்டங்கள்', sowing: 'விதைப்பு', harvest: 'அறுவடை', season: 'பருவம்', eligibility: 'யார் விண்ணப்பிக்கலாம்', visitPortal: 'அதிகாரப்பூர்வ தளம்', schemeNote: 'விதிகள் மாறும் — அதிகாரப்பூர்வ தளத்தில் சரிபார்க்கவும்.',
      months: ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'],
      journal: 'வலைப்பதிவு', journalTitle: 'வயலிலிருந்து *குறிப்புகள்.*', searchPosts: 'கட்டுரைகளைத் தேடு', by: '{a}', minRead: '{n} நிமிடம்', allPosts: 'அனைத்து கட்டுரைகள்', morePosts: 'மேலும் கட்டுரைகள்',
      contactTitle: '*வணக்கம்* சொல்லுங்கள்.', sendMessage: 'செய்தி அனுப்பு', subscribe: 'குழுசேர்', subscribed: 'நீங்கள் குழுசேர்ந்துவிட்டீர்கள்.', emailAddress: 'மின்னஞ்சல் முகவரி',
      topicBuying: 'பொருட்கள் வாங்க', topicFarmer: 'விவசாயியாக சேர', topicBulk: 'மொத்த / வணிக விநியோகம்', topicPartner: 'கூட்டாண்மை', topicOther: 'மற்றவை',
      msgThanks: 'நன்றி. ஒரு நாளுக்குள் பதிலளிப்போம்.', fillRequired: 'தேவையான விவரங்களை நிரப்பவும்.',
      fShop: 'கடை', fFarmers: 'விவசாயிகளுக்கு', fCompany: 'நிறுவனம்', fLegal: 'சட்டம்', fContact: 'தொடர்பு', allProducts: 'அனைத்து பொருட்கள்', bulk: 'மொத்த ஆர்டர்கள்', team: 'எங்கள் குழு',
    },
  };

  let current = 'en';

  function t(key, vars) {
    let s = (S[current] && S[current][key]) ?? S.en[key] ?? key;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return s;
  }

  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); const tgt = ks.reduce((a, k) => (a[k] && typeof a[k] === 'object' ? a[k] : (a[k] = {})), o); tgt[last] = v; };

  // Deep-copy content, applying `_t[lang]` overrides (flat dotted keys) wherever they exist.
  function localize(value, lang) {
    if (Array.isArray(value)) return value.map((v) => localize(v, lang));
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const k of Object.keys(value)) if (k !== '_t') out[k] = localize(value[k], lang);
    const tr = value._t && value._t[lang];
    if (tr && lang !== 'en') Object.entries(tr).forEach(([k, v]) => { if (v !== '' && v != null && !(Array.isArray(v) && !v.length)) setPath(out, k, v); });
    return out;
  }

  g.BHOOMI_I18N = {
    LANGS, strings: S, t, localize,
    get lang() { return current; },
    set lang(l) { current = S[l] ? l : 'en'; },
  };
})(this);
