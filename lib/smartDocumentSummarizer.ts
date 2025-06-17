// lib/smartDocumentSummarizer.ts - SEMANTIC CHUNKING & INTELLIGENT SUMMARIZATION
// Based on OpenAI Forum best practices for document processing

export interface DocumentSection {
  title: string;
  content: string;
  type: 'header' | 'experience' | 'education' | 'skills' | 'contact' | 'summary' | 'other';
  priority: number;
  keywords: string[];
}

export interface ConsolidatedSummary {
  candidateProfile: {
    name?: string;
    title: string;
    location?: string;
    contact?: {
      email?: string;
      phone?: string;
      linkedin?: string;
    };
  };
  
  professionalSummary: {
    overview: string;
    keyStrengths: string[];
    careerLevel: string;
    industryExpertise: string[];
  };
  
  workExperience: {
    totalYears: string;
    currentRole?: {
      title: string;
      company: string;
      duration: string;
      highlights: string[];
    };
    careerHighlights: string[];
    industryProgression: string;
  };
  
  technicalProfile: {
    coreTechnologies: string[];
    frameworks: string[];
    tools: string[];
    methodologies: string[];
  };
  
  achievements: {
    quantifiable: string[];
    leadership: string[];
    technical: string[];
    business: string[];
  };
  
  education: {
    formal: string[];
    certifications: string[];
    continuousLearning: string[];
  };
  
  interviewReadiness: {
    techQuestionTopics: string[];
    behavioralScenarios: string[];
    projectExamples: string[];
    companyFitAreas: string[];
  };
  
  contextualInsights: {
    communicationStyle: string;
    problemSolvingApproach: string;
    leadershipStyle?: string;
    collaborationPreferences: string;
  };
}

/**
 * Semantic Document Chunking - Splits documents by logical sections
 */
export function performSemanticChunking(content: string, documentType: string): DocumentSection[] {
  console.log(`Performing semantic chunking for ${documentType}...`);
  
  const sections: DocumentSection[] = [];
  
  // CV/Resume specific chunking
  if (documentType === 'cv' || documentType === 'resume') {
    return chunkResumeDocument(content);
  }
  
  // Cover letter chunking
  if (documentType === 'cover_letter') {
    return chunkCoverLetter(content);
  }
  
  // Job description chunking
  if (documentType === 'job_description') {
    return chunkJobDescription(content);
  }
  
  // Generic document chunking
  return chunkGenericDocument(content);
}

function chunkResumeDocument(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  
  // Common resume section patterns
  const sectionPatterns = [
    { 
      pattern: /(?:^|\n)\s*(?:PROFESSIONAL\s+)?SUMMARY(?:\s|:|\n)/i, 
      type: 'summary' as const, 
      title: 'Professional Summary',
      priority: 10 
    },
    { 
      pattern: /(?:^|\n)\s*(?:WORK\s+)?EXPERIENCE(?:\s|:|\n)/i, 
      type: 'experience' as const, 
      title: 'Work Experience',
      priority: 9 
    },
    { 
      pattern: /(?:^|\n)\s*(?:PROFESSIONAL\s+)?EXPERIENCE(?:\s|:|\n)/i, 
      type: 'experience' as const, 
      title: 'Professional Experience',
      priority: 9 
    },
    { 
      pattern: /(?:^|\n)\s*(?:TECHNICAL\s+)?SKILLS(?:\s|:|\n)/i, 
      type: 'skills' as const, 
      title: 'Technical Skills',
      priority: 8 
    },
    { 
      pattern: /(?:^|\n)\s*EDUCATION(?:\s|:|\n)/i, 
      type: 'education' as const, 
      title: 'Education',
      priority: 7 
    },
    { 
      pattern: /(?:^|\n)\s*(?:CONTACT|PERSONAL)(?:\s+INFO)?(?:\s|:|\n)/i, 
      type: 'contact' as const, 
      title: 'Contact Information',
      priority: 6 
    }
  ];
  
  // Find section breaks
  const sectionBreaks: Array<{index: number, type: any, title: string, priority: number}> = [];
  
  sectionPatterns.forEach(({pattern, type, title, priority}) => {
    const matches = Array.from(content.matchAll(new RegExp(pattern.source, 'gi')));
    matches.forEach(match => {
      if (match.index !== undefined) {
        sectionBreaks.push({
          index: match.index,
          type,
          title,
          priority
        });
      }
    });
  });
  
  // Sort by position in document
  sectionBreaks.sort((a, b) => a.index - b.index);
  
  // Extract sections
  for (let i = 0; i < sectionBreaks.length; i++) {
    const currentSection = sectionBreaks[i];
    const nextSection = sectionBreaks[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : content.length;
    
    const sectionContent = content.substring(startIndex, endIndex).trim();
    
    if (sectionContent.length > 50) { // Minimum section size
      const keywords = extractSectionKeywords(sectionContent, currentSection.type);
      
      sections.push({
        title: currentSection.title,
        content: sectionContent,
        type: currentSection.type,
        priority: currentSection.priority,
        keywords
      });
    }
  }
  
  // If no sections found, create one main section
  if (sections.length === 0) {
    sections.push({
      title: 'Resume Content',
      content: content,
      type: 'other',
      priority: 5,
      keywords: extractSectionKeywords(content, 'other')
    });
  }
  
  console.log(`Resume chunked into ${sections.length} semantic sections`);
  return sections;
}

function chunkCoverLetter(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  
  // Split cover letter into logical paragraphs
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
  
  paragraphs.forEach((paragraph, index) => {
    let sectionType: any = 'other';
    let title = `Paragraph ${index + 1}`;
    
    if (index === 0) {
      sectionType = 'summary';
      title = 'Opening & Introduction';
    } else if (index === paragraphs.length - 1) {
      title = 'Closing Statement';
    } else {
      title = `Key Argument ${index}`;
    }
    
    const keywords = extractSectionKeywords(paragraph, sectionType);
    
    sections.push({
      title,
      content: paragraph.trim(),
      type: sectionType,
      priority: 8 - index, // Decreasing priority
      keywords
    });
  });
  
  console.log(`Cover letter chunked into ${sections.length} logical sections`);
  return sections;
}

function chunkJobDescription(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  
  // Job description section patterns
  const jobSectionPatterns = [
    { pattern: /(?:^|\n)\s*(?:JOB\s+)?(?:ROLE\s+)?DESCRIPTION(?:\s|:|\n)/i, title: 'Role Description', priority: 10 },
    { pattern: /(?:^|\n)\s*RESPONSIBILITIES(?:\s|:|\n)/i, title: 'Key Responsibilities', priority: 9 },
    { pattern: /(?:^|\n)\s*REQUIREMENTS(?:\s|:|\n)/i, title: 'Requirements', priority: 8 },
    { pattern: /(?:^|\n)\s*(?:REQUIRED\s+)?SKILLS(?:\s|:|\n)/i, title: 'Required Skills', priority: 7 },
    { pattern: /(?:^|\n)\s*(?:NICE\s+TO\s+HAVE|PREFERRED)(?:\s|:|\n)/i, title: 'Preferred Qualifications', priority: 6 },
    { pattern: /(?:^|\n)\s*BENEFITS(?:\s|:|\n)/i, title: 'Benefits & Compensation', priority: 5 }
  ];
  
  const sectionBreaks: Array<{index: number, title: string, priority: number}> = [];
  
  jobSectionPatterns.forEach(({pattern, title, priority}) => {
    const matches = Array.from(content.matchAll(new RegExp(pattern.source, 'gi')));
    matches.forEach(match => {
      if (match.index !== undefined) {
        sectionBreaks.push({
          index: match.index,
          title,
          priority
        });
      }
    });
  });
  
  // Sort and extract sections
  sectionBreaks.sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < sectionBreaks.length; i++) {
    const currentSection = sectionBreaks[i];
    const nextSection = sectionBreaks[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : content.length;
    
    const sectionContent = content.substring(startIndex, endIndex).trim();
    
    if (sectionContent.length > 30) {
      const keywords = extractSectionKeywords(sectionContent, 'other');
      
      sections.push({
        title: currentSection.title,
        content: sectionContent,
        type: 'other',
        priority: currentSection.priority,
        keywords
      });
    }
  }
  
  console.log(`Job description chunked into ${sections.length} requirement sections`);
  return sections;
}

function chunkGenericDocument(content: string): DocumentSection[] {
  // For generic documents, split by major paragraph breaks
  const chunks = content.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 100);
  
  return chunks.map((chunk, index) => ({
    title: `Section ${index + 1}`,
    content: chunk.trim(),
    type: 'other' as const,
    priority: 5,
    keywords: extractSectionKeywords(chunk, 'other')
  }));
}

function extractSectionKeywords(content: string, sectionType: string): string[] {
  const text = content.toLowerCase();
  const keywords: string[] = [];
  
  // Technical skills patterns
  const techPatterns = [
    /\b(?:javascript|typescript|python|java|react|angular|vue|node\.?js|express|mongodb|postgresql|mysql|aws|azure|docker|kubernetes)\b/g,
    /\b(?:html|css|sass|scss|bootstrap|tailwind|git|github|gitlab|jenkins|ci\/cd)\b/g,
    /\b(?:agile|scrum|kanban|jira|confluence|slack|teams|figma|sketch|photoshop)\b/g
  ];
  
  techPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });
  
  // Industry keywords
  const industryPatterns = [
    /\b(?:startup|enterprise|fintech|healthcare|e-commerce|saas|b2b|b2c)\b/g,
    /\b(?:remote|hybrid|onsite|full-time|part-time|contract|freelance)\b/g
  ];
  
  industryPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });
  
  // Remove duplicates and return
  return Array.from(new Set(keywords));
}

/**
 * Consolidate multiple document sections into a unified candidate profile
 */
export async function consolidateDocumentSections(
  allSections: DocumentSection[], 
  documentAnalyses: any[]
): Promise<ConsolidatedSummary> {
  console.log(`Consolidating ${allSections.length} sections from ${documentAnalyses.length} documents...`);
  
  // Sort sections by priority
  const prioritizedSections = allSections.sort((a, b) => b.priority - a.priority);
  
  // Extract candidate basic info
  const candidateProfile = extractCandidateProfile(prioritizedSections, documentAnalyses);
  
  // Build professional summary from high-priority sections
  const professionalSummary = buildProfessionalSummary(prioritizedSections, documentAnalyses);
  
  // Extract work experience insights
  const workExperience = extractWorkExperience(prioritizedSections, documentAnalyses);
  
  // Build technical profile
  const technicalProfile = buildTechnicalProfile(prioritizedSections, documentAnalyses);
  
  // Extract achievements
  const achievements = extractAchievements(prioritizedSections, documentAnalyses);
  
  // Education summary
  const education = extractEducation(prioritizedSections, documentAnalyses);
  
  // Interview readiness insights
  const interviewReadiness = buildInterviewReadiness(prioritizedSections, documentAnalyses);
  
  // Contextual insights for AI responses
  const contextualInsights = extractContextualInsights(prioritizedSections, documentAnalyses);
  
  const consolidatedSummary: ConsolidatedSummary = {
    candidateProfile,
    professionalSummary,
    workExperience,
    technicalProfile,
    achievements,
    education,
    interviewReadiness,
    contextualInsights
  };
  
  console.log('Document consolidation completed successfully');
  return consolidatedSummary;
}

function extractCandidateProfile(sections: DocumentSection[], analyses: any[]) {
  // Extract contact info from analyses
  const contactInfo = analyses.find(a => a.contactInfo)?.contactInfo || {};
  
  return {
    name: contactInfo.name || undefined,
    title: "Professional", // Will be refined based on content
    location: contactInfo.location !== "not extracted" ? contactInfo.location : undefined,
    contact: {
      email: contactInfo.email !== "not extracted" ? contactInfo.email : undefined,
      phone: contactInfo.phone !== "not extracted" ? contactInfo.phone : undefined,
      linkedin: contactInfo.linkedin !== "not extracted" ? contactInfo.linkedin : undefined,
    }
  };
}

function buildProfessionalSummary(sections: DocumentSection[], analyses: any[]) {
  const allSkills = analyses.flatMap(a => a.extractedSkills || []);
  const uniqueSkills = Array.from(new Set(allSkills));
  
  const industries = analyses.flatMap(a => a.experienceDetails?.industries || []);
  const uniqueIndustries = Array.from(new Set(industries));
  
  return {
    overview: "Experienced professional with diverse background and strong technical capabilities",
    keyStrengths: uniqueSkills.slice(0, 8),
    careerLevel: analyses[0]?.experienceDetails?.careerLevel || "Professional",
    industryExpertise: uniqueIndustries.slice(0, 4)
  };
}

function extractWorkExperience(sections: DocumentSection[], analyses: any[]) {
  const workHistories = analyses.flatMap(a => a.experienceDetails?.workHistory || []);
  const currentRole = workHistories.find(w => w.endDate === "Present" || w.endDate.includes("Current"));
  
  const careerHighlights = analyses.flatMap(a => a.keyAchievements || []).slice(0, 6);
  
  return {
    totalYears: analyses[0]?.experienceDetails?.totalYears || "Professional experience",
    currentRole: currentRole ? {
      title: currentRole.position,
      company: currentRole.company,
      duration: currentRole.duration,
      highlights: currentRole.achievements || []
    } : undefined,
    careerHighlights,
    industryProgression: "Professional growth across multiple domains"
  };
}

function buildTechnicalProfile(sections: DocumentSection[], analyses: any[]) {
  const allSkills = analyses.flatMap(a => a.extractedSkills || []);
  
  // Categorize skills
  const technologies = allSkills.filter(skill => 
    /\b(?:javascript|typescript|python|java|react|angular|vue|node|express)\b/i.test(skill)
  );
  
  const frameworks = allSkills.filter(skill => 
    /\b(?:react|angular|vue|express|spring|django|flask|laravel)\b/i.test(skill)
  );
  
  const tools = allSkills.filter(skill => 
    /\b(?:git|docker|kubernetes|jenkins|aws|azure|jira|confluence)\b/i.test(skill)
  );
  
  const methodologies = allSkills.filter(skill => 
    /\b(?:agile|scrum|kanban|devops|ci\/cd|tdd|bdd)\b/i.test(skill)
  );
  
  return {
    coreTechnologies: Array.from(new Set(technologies)).slice(0, 8),
    frameworks: Array.from(new Set(frameworks)).slice(0, 6),
    tools: Array.from(new Set(tools)).slice(0, 8),
    methodologies: Array.from(new Set(methodologies)).slice(0, 4)
  };
}

function extractAchievements(sections: DocumentSection[], analyses: any[]) {
  const allAchievements = analyses.flatMap(a => a.keyAchievements || []);
  
  return {
    quantifiable: allAchievements.filter(a => /\d+%|improved|increased|reduced|saved/i.test(a)).slice(0, 4),
    leadership: allAchievements.filter(a => /led|managed|coordinated|mentored|team/i.test(a)).slice(0, 3),
    technical: allAchievements.filter(a => /built|developed|implemented|deployed|optimized/i.test(a)).slice(0, 4),
    business: allAchievements.filter(a => /revenue|customer|user|business|growth/i.test(a)).slice(0, 3)
  };
}

function extractEducation(sections: DocumentSection[], analyses: any[]) {
  const educationData = analyses.map(a => a.education).filter(Boolean);
  
  return {
    formal: educationData.flatMap(e => e.degrees || []),
    certifications: educationData.flatMap(e => e.certifications || []),
    continuousLearning: educationData.flatMap(e => e.continuousLearning || [])
  };
}

function buildInterviewReadiness(sections: DocumentSection[], analyses: any[]) {
  const skills = analyses.flatMap(a => a.extractedSkills || []);
  
  return {
    techQuestionTopics: skills.slice(0, 10),
    behavioralScenarios: [
      "Problem-solving under pressure",
      "Team collaboration and conflict resolution",
      "Leadership and mentoring experiences",
      "Adapting to change and learning new technologies"
    ],
    projectExamples: analyses.flatMap(a => a.keyAchievements || []).slice(0, 5),
    companyFitAreas: [
      "Technical expertise alignment",
      "Cultural fit and team collaboration",
      "Growth mindset and continuous learning",
      "Communication and presentation skills"
    ]
  };
}

function extractContextualInsights(sections: DocumentSection[], analyses: any[]) {
  return {
    communicationStyle: "Professional and articulate",
    problemSolvingApproach: "Analytical and methodical",
    leadershipStyle: "Collaborative and supportive",
    collaborationPreferences: "Team-oriented with strong interpersonal skills"
  };
}