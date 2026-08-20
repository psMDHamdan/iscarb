/**
 * iSCARB Learning SPARQL Queries — Phase 9 Learning Intelligence Platform
 * ===========================================================================
 * Canonical SPARQL queries for learning entities.
 * ===========================================================================
 */

export const learningSparqlQueries = {
  // Student's full learning journey with goals and milestones
  studentLearningJourney: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?journey ?journeyName ?goal ?goalName ?milestone ?milestoneName ?achieved
    WHERE {
      ?journey rdf:type iSCARB:LearningJourney ;
               rdfs:label ?journeyName ;
               iSCARB:hasLearningGoal ?goal .
      ?goal rdfs:label ?goalName .
      OPTIONAL {
        ?goal iSCARB:achievesMilestone ?milestone .
        ?milestone rdfs:label ?milestoneName .
        ?milestone iSCARB:achieved ?achieved .
      }
    }
    ORDER BY ?goalName
  `,

  // Flashcards due for review (next review date <= now)
  flashcardDueCards: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?card ?cardName ?front ?back ?difficulty ?deckName
    WHERE {
      ?deck iSCARB:containsFlashcard ?card .
      ?card rdf:type iSCARB:Flashcard ;
            rdfs:label ?cardName ;
            iSCARB:frontContent ?front ;
            iSCARB:backContent ?back ;
            iSCARB:difficultyLevel ?difficulty ;
            iSCARB:nextReviewDate ?nextReview .
      ?deck rdfs:label ?deckName .
      FILTER (?nextReview <= NOW())
    }
    ORDER BY ?nextReview
  `,

  // Knowledge gaps for a specific student
  studentKnowledgeGaps: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?gap ?gapName ?subject ?subjectName ?severity ?detectedDate
    WHERE {
      ?student iSCARB:hasKnowledgeGap ?gap .
      ?gap rdf:type iSCARB:KnowledgeGap ;
           rdfs:label ?gapName ;
           iSCARB:severity ?severity ;
           iSCARB:detectedDate ?detectedDate .
      OPTIONAL {
        ?gap iSCARB:targetsSubject ?subject .
        ?subject rdfs:label ?subjectName .
      }
    }
    ORDER BY DESC(?severity)
  `,

  // Mastery predictions for a student
  studentMasteryPredictions: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?prediction ?subject ?subjectName ?masteryLevel ?predictedDate ?confidence
    WHERE {
      ?student iSCARB:hasMasteryPrediction ?prediction .
      ?prediction rdf:type iSCARB:MasteryPrediction ;
                  iSCARB:masteryLevel ?masteryLevel ;
                  iSCARB:predictedDate ?predictedDate ;
                  iSCARB:confidenceScore ?confidence .
      OPTIONAL {
        ?prediction iSCARB:targetsSubject ?subject .
        ?subject rdfs:label ?subjectName .
      }
    }
    ORDER BY DESC(?masteryLevel)
  `,

  // Learning streak data for a student
  learningStreakData: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?streak ?currentCount ?longestCount ?lastActiveDate
    WHERE {
      ?student iSCARB:hasLearningStreak ?streak .
      ?streak rdf:type iSCARB:LearningStreak ;
              iSCARB:streakCount ?currentCount ;
              iSCARB:longestStreak ?longestCount ;
              iSCARB:lastActiveDate ?lastActiveDate .
    }
  `,

  // Study session history for a student
  studySessionHistory: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?session ?sessionName ?duration ?startDate ?endDate ?topic ?topicName
    WHERE {
      ?student iSCARB:completesStudySession ?session .
      ?session rdf:type iSCARB:StudySession ;
               rdfs:label ?sessionName ;
               iSCARB:sessionDurationMinutes ?duration ;
               iSCARB:startDate ?startDate ;
               iSCARB:endDate ?endDate .
      OPTIONAL {
        ?session iSCARB:hasTopic ?topic .
        ?topic rdfs:label ?topicName .
      }
    }
    ORDER BY DESC(?startDate)
  `,

  // Leaderboard query (top students by XP)
  leaderboardQuery: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    SELECT ?student ?studentName ?totalXP ?badgesEarned ?streakDays
    WHERE {
      ?student rdf:type iSCARB:Student ;
               foaf:name ?studentName ;
               iSCARB:hasExperiencePoints ?xp ;
               iSCARB:hasLearningStreak ?streak .
      ?xp iSCARB:totalXP ?totalXP .
      ?streak iSCARB:streakCount ?streakDays .
      OPTIONAL {
        SELECT ?student (COUNT(?cred) AS ?badgesEarned)
        WHERE {
          ?student iSCARB:earnsCredential ?cred .
        }
        GROUP BY ?student
      }
    }
    ORDER BY DESC(?totalXP)
    LIMIT 50
  `,

  // Verify a digital credential
  credentialVerification: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    ASK
    WHERE {
      ?credential rdf:type iSCARB:DigitalCredential ;
                  iSCARB:credentialId ?credId ;
                  iSCARB:issuedTo ?student ;
                  iSCARB:issuedDate ?issued ;
                  iSCARB:notExpired true .
      ?student rdfs:label ?studentName .
      FILTER (?credId = "CREDENTIAL_ID")
    }
  `,

  // Competency mastery across all subjects
  competencyMasteryQuery: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?subject ?subjectName ?masteryLevel ?totalCards ?reviewedCards ?accuracyRate
    WHERE {
      ?subject rdf:type iSCARB:Course ;
               rdfs:label ?subjectName .
      ?student iSCARB:hasMasteryPrediction ?prediction .
      ?prediction iSCARB:targetsSubject ?subject ;
                  iSCARB:masteryLevel ?masteryLevel .
      OPTIONAL {
        SELECT ?subject (COUNT(?card) AS ?totalCards) (COUNT(?review) AS ?reviewedCards)
        WHERE {
          ?subject iSCARB:hasFlashcard ?card .
          OPTIONAL { ?review iSCARB:reviewsFlashcard ?card }
        }
        GROUP BY ?subject
      }
    }
    ORDER BY DESC(?masteryLevel)
  `,

  // Adaptive learning path based on gaps and predictions
  adaptiveLearningPath: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?nextStep ?stepType ?stepName ?priority ?estimatedMinutes
    WHERE {
      ?student iSCARB:recommendedByAI ?recommendation .
      ?recommendation iSCARB:nextStep ?nextStep ;
                     iSCARB:stepPriority ?priority ;
                     iSCARB:estimatedMinutes ?estimatedMinutes .
      ?nextStep rdf:type ?stepType ;
                rdfs:label ?stepName .
      FILTER (?stepType IN (iSCARB:FlashcardDeck, iSCARB:StudySession, iSCARB:LearningChallenge))
    }
    ORDER BY ?priority
  `,

  // Learning engagement statistics
  learningEngagementStats: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?student
           (COUNT(?session) AS ?totalSessions)
           (SUM(?duration) AS ?totalMinutes)
           (AVG(?duration) AS ?avgSessionMinutes)
           (COUNT(?card) AS ?cardsReviewed)
    WHERE {
      ?student iSCARB:completesStudySession ?session .
      ?session iSCARB:sessionDurationMinutes ?duration .
      OPTIONAL { ?session iSCARB:reviewsFlashcard ?card }
    }
    GROUP BY ?student
  `,

  // Student health score (composite learning metrics)
  studentHealthScore: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?student
           ?streakDays
           ?totalXP
           ?gapCount
           ?avgMastery
           ((
             (?streakDays * 0.2) +
             (IF(?totalXP > 1000, 1.0, ?totalXP / 1000.0) * 0.3) +
             (IF(?gapCount = 0, 1.0, 1.0 / (1.0 + ?gapCount)) * 0.25) +
             (?avgMastery * 0.25)
           ) AS ?healthScore)
    WHERE {
      ?student iSCARB:hasLearningStreak ?streak ;
               iSCARB:hasExperiencePoints ?xp .
      ?streak iSCARB:streakCount ?streakDays .
      ?xp iSCARB:totalXP ?totalXP .
      OPTIONAL {
        SELECT ?student (COUNT(?gap) AS ?gapCount)
        WHERE {
          ?student iSCARB:hasKnowledgeGap ?gap .
        }
        GROUP BY ?student
      }
      OPTIONAL {
        SELECT ?student (AVG(?level) AS ?avgMastery)
        WHERE {
          ?student iSCARB:hasMasteryPrediction ?pred .
          ?pred iSCARB:masteryLevel ?level .
        }
        GROUP BY ?student
      }
    }
    ORDER BY DESC(?healthScore)
  `,
};
