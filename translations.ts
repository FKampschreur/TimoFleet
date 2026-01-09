import { Language } from './types';

export const translations = {
  nl: {
    nav: {
      home: 'Home',
      dashboard: 'Route Planning',
      fleet: 'Vloot Beheer',
      drivers: 'Rooster',
      fixedRoutes: 'Vaste Ritten',
      performance: 'Prestaties',
      users: 'Gebruikers',
      debtors: 'Debiteuren',
      about: 'Over Timo Fleet',
    },
    login: {
      title: 'Welkom bij Timo Fleet',
      subtitle: 'Log in om uw vloot te beheren.',
      emailLabel: 'E-mailadres',
      passwordLabel: 'Wachtwoord',
      loginButton: 'Inloggen',
      error: 'Onjuiste e-mail of wachtwoord.',
      loggingIn: 'Inloggen...'
    },
    profile: {
      title: 'Mijn Profiel',
      subtitle: 'Beheer je persoonlijke gegevens',
      loggedInAs: 'Ingelogd als',
      editProfile: 'Profiel Bewerken',
      logout: 'Uitloggen',
      nameLabel: 'Naam',
      emailLabel: 'E-mailadres',
      photoLabel: 'Profielfoto',
      uploadPhoto: 'Foto Uploaden',
      removePhoto: 'Foto Verwijderen',
      saveSuccess: 'Profiel succesvol bijgewerkt!'
    },
    debtors: {
      title: 'Debiteurenbeheer',
      subtitle: 'Beheer afleveradressen en specifieke bloktijden.',
      addDebtor: 'Debiteur Toevoegen',
      totalDebtors: 'Totaal Debiteuren',
      searchPlaceholder: 'Zoek op naam, adres of stad...',
      selected: 'Geselecteerd',
      copyToPlanning: 'Kopiëren naar Planning',
      copySuccess: 'debiteuren gekopieerd naar route planning sessie.',
      sortBy: 'Sorteer op',
      sort: {
        name: 'Naam (A-Z)',
        city: 'Plaats',
        foundation: 'Stichting',
        location: 'Containerlocatie',
        route: 'Gekoppelde Rit'
      },
      table: {
        name: 'Klantnaam & Stichting',
        address: 'Adres & Locatie',
        timeWindow: 'Bloktijden',
        deliveryDays: 'Leverdagen',
        capacity: 'Standaard Lading',
        actions: 'Acties'
      },
      modal: {
        newTitle: 'Nieuwe Debiteur',
        editTitle: 'Debiteur Bewerken',
        debtorNumber: 'Debiteurnummer',
        foundation: 'Stichting',
        name: 'Klantnaam',
        address: 'Adres',
        postcode: 'Postcode',
        city: 'Woonplaats',
        containerLocation: 'Containerlocatie',
        deliveryDays: 'Leverdagen (Verplicht)',
        windowStart: 'Bloktijd Start',
        windowEnd: 'Bloktijd Eind',
        dropTime: 'Lostijd (minuten)',
        chilled: 'Koel Containers',
        frozen: 'Vries Containers'
      }
    },
    performance: {
        title: 'Prestatie Analyse',
        subtitle: 'Vergelijk werkelijke rijtijden per chauffeur op vaste routes.',
        tabInput: 'Tijdregistratie',
        tabAnalysis: 'Route Analyse',
        addRecord: 'Uren Toevoegen',
        selectRoute: 'Selecteer Vaste Route',
        selectPeriod: 'Analyse Periode',
        periodStart: 'Van',
        periodEnd: 'Tot',
        filterDay: 'Specifieke Weekdag',
        allDays: 'Alle Dagen',
        weekDays: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
        avgDuration: 'Gemiddelde Duur',
        fastest: 'Snelste Tijd',
        slowest: 'Langzaamste Tijd',
        trend: 'Trend',
        insight: 'Manager Inzicht',
        viewExcluded: 'Bekijk Logboek Uitsluitingen',
        table: {
            date: 'Datum',
            driver: 'Chauffeur',
            route: 'Route',
            times: 'Tijden',
            duration: 'Duur',
            actions: 'Acties',
            remarks: 'Reden / Opmerking'
        },
        form: {
            date: 'Datum Rit',
            driver: 'Chauffeur',
            route: 'Gereden Route',
            start: 'Starttijd (Inklok)',
            end: 'Eindtijd (Uitklok)',
            remarks: 'Opmerkingen (Reden vertraging etc.)'
        },
        modal: {
            title: 'Registratie Bewerken',
            exclude: 'Uitsluiten van Analyse',
            excludeDesc: 'Vink dit aan bij incidenten (ongeluk, pech) zodat het gemiddelde niet wordt beïnvloed.',
            deleteConfirm: 'Weet u zeker dat u deze tijdsregistratie wilt verwijderen?',
            excludedTitle: 'Logboek Uitgesloten Ritten',
            restore: 'Herstellen',
            noExcluded: 'Geen uitgesloten ritten gevonden.'
        }
    },
    users: {
        title: 'Gebruikersbeheer',
        subtitle: 'Voeg medewerkers toe en beheer hun toegangsrechten.',
        addUser: 'Gebruiker Toevoegen',
        totalUsers: 'Totaal Gebruikers',
        admins: 'Beheerders',
        table: {
            user: 'Gebruiker',
            email: 'E-mailadres',
            role: 'Rol',
            actions: 'Acties'
        },
        modal: {
            newTitle: 'Nieuwe Gebruiker Toevoegen',
            editTitle: 'Gebruiker Bewerken',
            name: 'Volledige Naam',
            email: 'E-mailadres',
            password: 'Wachtwoord',
            passwordHint: 'Minimaal 6 karakters',
            role: 'Gebruikersrol',
            confirmDelete: 'Weet u zeker dat u deze gebruiker wilt verwijderen?',
            roleAdmin: 'Beheerder',
            roleUser: 'Gebruiker'
        }
    },
    home: {
        welcome: 'Welkom bij Timo Fleet',
        subtitle: 'Selecteer een module om te beginnen',
        cards: {
            dashboard: {
                title: 'Route Planning',
                desc: 'Genereer optimale ritten met AI, bekijk kostenanalyses en exporteer rapportages.'
            },
            fleet: {
                title: 'Vloot Beheer',
                desc: 'Beheer voertuigen, specificaties, tarieven en beschikbaarheid van het wagenpark.'
            },
            drivers: {
                title: 'Chauffeurs Rooster',
                desc: 'Plan diensten, beheer afwezigheid en gebruik AI voor automatische personeelsplanning.'
            },
            fixedRoutes: {
                title: 'Vaste Ritten',
                desc: 'Beheer vaste routeprofielen en wijs vaste chauffeurs toe aan terugkerende ritten.'
            },
            debtors: {
                title: 'Debiteuren',
                desc: 'Beheer afleveradressen en bloktijden voor een nauwkeurige routeplanning.'
            },
            performance: {
                title: 'Prestaties',
                desc: 'Analyseer rittijden per chauffeur en vergelijk prestaties op vaste routes.'
            }
        }
    },
    chatbot: {
        title: 'Timo Fleet Assistent',
        placeholder: 'Stel een vraag over de planning...',
        welcome: 'Hallo! Ik ben uw AI-assistent van Timo Fleet. Ik help u graag met data-gedreven inzichten.',
        online: 'Timo Intelligence Active',
        thinking: 'Analyseren...'
    },
    common: {
      cancel: 'Annuleren',
      save: 'Opslaan',
      add: 'Toevoegen',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      active: 'Actief',
      inactive: 'Inactief',
      total: 'Totaal',
      language: 'Taal',
      close: 'Sluiten',
      generalInfo: 'Algemene Informatie',
    },
    drivers: {
        title: 'Chauffeursplanning',
        subtitle: 'Beheer roosters en beschikbaarheid van 40 chauffeurs',
        filterLicense: 'Filter op Rijbewijs',
        searchPlaceholder: 'Zoek chauffeur...',
        shiftWork: 'Dienst',
        shiftSick: 'Ziek',
        shiftVacation: 'Verlof',
        shiftRosterFree: 'Roldag',
        shiftTraining: 'Code 95',
        addDriver: 'Chauffeur Toevoegen',
        autoPlan: 'AI Auto-Rooster',
        stats: {
            availableToday: 'Inzetbaar Vandaag',
            onLeave: 'Met Verlof/Ziek',
            cLicense: 'C-Chauffeurs',
            bLicense: 'B/BE-Chauffeurs'
        },
        table: {
            driver: 'Chauffeur',
            license: 'Rijbewijs'
        },
        modal: {
            title: 'Dienst Inplannen',
            subtitle: 'Kies een diensttype of status voor',
            shifts: 'Werktijden',
            absence: 'Afwezigheid',
            other: 'Overig',
            night: 'Nachtrit',
            early: 'Vroege Rit',
            normal: 'Dagrit',
            late: 'Late Dienst',
            custom: 'Aangepast',
            clear: 'Dienst Wissen'
        },
        manage: {
            newTitle: 'Nieuwe Chauffeur',
            editTitle: 'Chauffeur Bewerken',
            name: 'Naam',
            license: 'Rijbewijs',
            phone: 'Telefoon',
            email: 'E-mail',
            photo: 'Profielfoto',
            uploadPhoto: 'Foto Uploaden',
            removePhoto: 'Foto Verwijderen',
            workingDays: 'Contractdagen (Werkweek)',
            routeKnowledge: 'Routekennis (Vaste Ritten)',
            routeKnowledgeDesc: 'Selecteer welke routes deze chauffeur kent. De planning zal hier rekening mee houden.',
            deleteConfirm: 'Weet u zeker dat u deze chauffeur wilt verwijderen?'
        },
        autoPlanModal: {
            title: 'AI Rooster & Rit Generator',
            description: 'Genereer automatisch roosters en wijs vaste ritten toe voor een specifieke periode. Het algoritme respecteert bestaand verlof en ziekte.',
            startDate: 'Startdatum',
            endDate: 'Einddatum',
            generate: 'Genereer Planning',
            warning: 'Let op: Bestaande werkdiensten in deze periode worden overschreven. Ziekte en verlof blijven staan.',
            success: 'Planning succesvol gegenereerd!',
            shortageTitle: 'Capaciteitstekort Gedetecteerd',
            shortageDesc: 'De planning is gegenereerd, maar niet alle ritten konden worden toegewezen door een tekort aan beschikbare chauffeurs.',
            adviceHeader: 'Strategisch Advies:',
            adviceHire: 'Overweeg inhuur flexibele schil (uitzendkrachten)',
            adviceReschedule: 'Bekijk of ritten verschoven kunnen worden naar',
            missing: 'Tekort',
            onDate: 'op'
        }
    },
    fixedRoutes: {
        title: 'Vaste Ritten Planning',
        subtitle: 'Koppel beschikbare chauffeurs aan de 25 vaste routes',
        unassigned: 'Niet Toegewezen',
        assignDriver: 'Koppel Chauffeur',
        routeInfo: 'Route Info',
        requiredLicense: 'Vereist',
        startTime: 'Starttijd',
        duration: 'Duur',
        modalTitle: 'Selecteer Chauffeur',
        modalSubtitle: 'Beschikbare chauffeurs voor',
        noDrivers: 'Geen chauffeurs beschikbaar met het juiste rijbewijs and rooster voor deze dag.',
        searchDriver: 'Zoek beschikbare chauffeur...',
        conflict: 'Let op: Chauffeur heeft al een route deze dag',
        addRoute: 'Route Toevoegen',
        dayDetail: {
            title: 'Route Detail',
            subtitle: 'Stops voor',
            stops: 'Geplande Stops',
            active: 'Actief',
            inactive: 'Niet Leveren',
            empty: 'Geen stops gepland voor deze dag.'
        },
        edit: {
            title: 'Route Bewerken',
            newTitle: 'Nieuwe Route',
            name: 'Route Naam',
            region: 'Regio / Gebied',
            startTime: 'Vertrektijd',
            duration: 'Duur (uur)',
            containersChilled: 'Containers Koel',
            containersFrozen: 'Containers Vries',
            days: 'Actieve Leverdagen',
            requiresElectric: 'Milieuzone / Elektrisch',
            description: 'Pas de eigenschappen van deze vaste route aan. Wijzigingen hebben invloed op de planning en capaciteitsberekeningen.',
            deleteRoute: 'Route Verwijderen',
            deleteConfirm: 'Weet u zeker dat u deze route wilt verwijderen? Dit verwijdert ook alle toewijzingen.'
        }
    },
    fleet: {
      title: 'Vloot Beheer',
      subtitle: 'Configureer uw wagenpark, aandrijving en capaciteiten.',
      addVehicle: 'Voertuig Toevoegen',
      export: 'Exporteren',
      totalVehicles: 'Total voertuigen',
      noVehicles: 'Geen voertuigen gevonden. Voeg er een toe om te beginnen.',
      table: {
        vehicle: 'Voertuig',
        typeLicense: 'Type & Rijbewijs',
        powertrain: 'Aandrijving',
        capacity: 'Capaciteit',
        status: 'Status',
        actions: 'Acties',
      },
      specs: {
        range: 'Bereik',
        consumption: 'Verbruik',
        price: 'Price',
        emission: 'Uitstoot',
        license: 'Rijbewijs',
      },
      modal: {
        newTitle: 'Nieuw Voertuig Toevoegen',
        editTitle: 'Voertuig Bewerken',
        newSubtitle: 'Vul de specificaties in voor het nieuwe voertuig',
        id: 'Intern ID',
        licensePlate: 'Kenteken',
        brand: 'Merk',
        type: 'Type Voertuig',
        fuelType: 'Brandstof Type',
        maxRange: 'Max. Bereik (km)',
        unitPrice: 'Eenheidsprijs',
        loadCapacity: 'Laad Capaciteit',
        chilled: 'Koelvers',
        frozen: 'Diepvries',
        containers: 'containers',
        confirmDelete: 'Weet je zeker dat je dit voertuig wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
      }
    },
    apiKeyPrompt: {
      title: 'API Sleutel Vereist',
      description: 'Om de AI-optimalisatiefuncties te gebruiken, moet u een betaalde Google Gemini API-sleutel selecteren.',
      selectKeyButton: 'Selecteer API Sleutel',
      loading: 'Laden...',
      successMessage: 'API Sleutel succesvol geselecteerd! De applicatie start nu.',
      errorMessage: 'Fout bij het openen van het API sleutel selectiedialoogvenster. Probeer het opnieuw.',
      devModeWarning: 'API sleutel selectie is alleen beschikbaar in de AI Studio omgeving. Gebruik `process.env.API_KEY` voor lokale ontwikkeling.',
      billingInfo: 'Belangrijk: U moet een API-sleutel van een Google Cloud project met ingeschakelde facturering selecteren.',
      billingLinkText: 'Meer over facturering',
    },
    about: {
        title: 'Over Timo Fleet',
        subtitle: 'Powered by Timo Intelligence',
        introTitle: 'Strategisch Vlootbeheer',
        introText: 'Timo Fleet is uw strategische partner voor modern transportmanagement. Gedreven door AI, gaat dit platform verder dan simpere routeplanning. Wij bieden realtime vlootbeheer, dynamische chauffeursroosters en intelligente kostenreductie. Het systeem maakt autonome afwegingen op basis van uw bedrijfsdata: is een tijdvenster-boete voordeliger dan een extra voertuig inzetten? Prioriteren we elektrisch rijden voor duurzaamheid? Timo Fleet navigeert niet alleen uw wagens, maar ook uw bedrijfsstrategie.',
        intelligenceTitle: 'De Kracht van Timo Intelligence',
        intelligenceText: 'Timo Fleet is een integraal onderdeel van het Timo Intelligence ecosysteem. Wij geloven in de kracht van één centrale waarheid: één dataset die al uw processen aandrijft voor maximale synergie.',
        acronym_t_title: 'Technology',
        acronym_t_desc: 'Robuuste AI en cloud-oplossingen voor maximale betrouwbaarheid.',
        acronym_i_title: 'Intelligence',
        acronym_i_desc: 'Data omzetten in wijsheid en direct toepasbare, winstgevende inzichten.',
        acronym_m_title: 'Mastering',
        acronym_m_desc: 'Volledige grip en controle over al uw logistieke en operationele processen.',
        acronym_o_title: 'Optimization',
        acronym_o_desc: 'Een continu en automatisch streven naar kostenreductie en efficiëntie.'
    }
  }
};