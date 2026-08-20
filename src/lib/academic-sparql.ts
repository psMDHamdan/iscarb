/**
 * iSCARB Academic SPARQL Queries — Phase 8 Academic Platform
 * ===========================================================================
 * Canonical SPARQL queries for academic entities.
 * ===========================================================================
 */

export const academicSparqlQueries = {
  // Course prerequisite chain
  coursePrerequisites: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?course ?courseName ?prereq ?prereqName
    WHERE {
      ?course iSCARB:requiresPrerequisite ?prereq .
      ?course rdfs:label ?courseName .
      ?prereq rdfs:label ?prereqName .
    }
  `,

  // Faculty course assignments
  facultyCourseAssignments: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?faculty ?facultyName ?course ?courseName
    WHERE {
      ?faculty iSCARB:teaches ?course .
      ?faculty foaf:name ?facultyName .
      ?course rdfs:label ?courseName .
    }
  `,

  // Student enrollment queries
  studentEnrollments: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?student ?studentName ?course ?courseName
    WHERE {
      ?student iSCARB:enrolledIn ?course .
      ?student foaf:name ?studentName .
      ?course rdfs:label ?courseName .
    }
  `,

  // Course credits
  courseCredits: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?course ?courseName ?credits
    WHERE {
      ?course iSCARB:hasCredits ?credits .
      ?course rdfs:label ?courseName .
    }
  `,

  // Program curriculum
  programCurriculum: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?program ?programName ?curriculum ?curriculumName
    WHERE {
      ?program iSCARB:hasCurriculum ?curriculum .
      ?program rdfs:label ?programName .
      ?curriculum rdfs:label ?curriculumName .
    }
  `,

  // Timetable for a course
  courseTimetable: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?course ?courseName ?slot ?day ?startTime ?endTime ?room
    WHERE {
      ?course iSCARB:scheduledIn ?slot .
      ?course rdfs:label ?courseName .
      ?slot iSCARB:dayOfWeek ?day .
      ?slot iSCARB:startTime ?startTime .
      ?slot iSCARB:endTime ?endTime .
      OPTIONAL { ?slot iSCARB:hasClassroom ?room }
    }
  `,

  // Academic standing
  studentStanding: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?student ?studentName ?standing ?gpa
    WHERE {
      ?student iSCARB:hasStanding ?standing .
      ?student foaf:name ?studentName .
      ?standing iSCARB:gpa ?gpa .
    }
  `,

  // Graduation progress
  graduationProgress: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT ?student ?studentName ?earned ?required ?status
    WHERE {
      ?student iSCARB:hasGraduationProgress ?progress .
      ?student foaf:name ?studentName .
      ?progress iSCARB:creditsEarned ?earned .
      ?progress iSCARB:creditsRequired ?required .
      ?progress iSCARB:status ?status .
    }
  `,

  // Module lesson structure
  courseModuleStructure: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?course ?moduleName ?topicName ?lessonName
    WHERE {
      ?course iSCARB:hasModule ?module .
      ?module rdfs:label ?moduleName .
      ?module iSCARB:hasTopic ?topic .
      ?topic rdfs:label ?topicName .
      ?topic iSCARB:hasLesson ?lesson .
      ?lesson rdfs:label ?lessonName .
    }
  `,

  // Academic resource search
  academicResources: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?resource ?title ?type ?courseName
    WHERE {
      ?resource iSCARB:hasTitle ?title .
      ?resource iSCARB:hasType ?type .
      OPTIONAL {
        ?resource iSCARB:belongsToCourse ?course .
        ?course rdfs:label ?courseName .
      }
    }
  `,

  // Enrollment statistics
  enrollmentStats: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT (COUNT(?student) AS ?totalEnrolled)
    WHERE {
      ?student iSCARB:enrolledIn ?course .
    }
  `,

  // Cross-listed courses
  crossListedCourses: `
    PREFIX iSCARB: <https://iscarb.org/ontology#>
    SELECT ?course1 ?course1Name ?course2 ?course2Name
    WHERE {
      ?course1 iSCARB:crossListedWith ?course2 .
      ?course1 rdfs:label ?course1Name .
      ?course2 rdfs:label ?course2Name .
    }
  `,
};

export default academicSparqlQueries;
