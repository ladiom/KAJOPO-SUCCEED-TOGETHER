import { Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'education',
    name: 'Education',
    description: 'Educational opportunities and learning initiatives',
    icon: '🎓',
    subcategories: [
      { id: 'scholarships', name: 'Scholarships', description: 'Educational funding opportunities' },
      { id: 'edtech', name: 'EdTech', description: 'Educational technology solutions' },
      { id: 'teacher-training', name: 'Teacher Training', description: 'Professional development for educators' },
      { id: 'stem-labs', name: 'STEM Labs', description: 'Science, technology, engineering, and math facilities' }
    ]
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Healthcare and wellness initiatives',
    icon: '🏥',
    subcategories: [
      { id: 'preventive-care', name: 'Preventive Care', description: 'Health prevention and wellness programs' },
      { id: 'mental-health', name: 'Mental Health', description: 'Mental health support and services' },
      { id: 'mobile-clinics', name: 'Mobile Clinics', description: 'Mobile healthcare delivery' },
      { id: 'healthtech', name: 'HealthTech', description: 'Healthcare technology solutions' }
    ]
  },
  {
    id: 'social-impact',
    name: 'Social Impact',
    description: 'Social justice and community empowerment',
    icon: '🤝',
    subcategories: [
      { id: 'gender-equity', name: 'Gender Equity', description: 'Gender equality and women empowerment' },
      { id: 'disability-inclusion', name: 'Disability Inclusion', description: 'Accessibility and inclusion for people with disabilities' },
      { id: 'refugee-support', name: 'Refugee Support', description: 'Support services for refugees and displaced persons' },
      { id: 'youth-empowerment', name: 'Youth Empowerment', description: 'Programs for young people development' }
    ]
  },
  {
    id: 'economic-empowerment',
    name: 'Economic Empowerment',
    description: 'Financial inclusion and economic development',
    icon: '💰',
    subcategories: [
      { id: 'microfinance', name: 'Microfinance', description: 'Small-scale financial services' },
      { id: 'vocational-grants', name: 'Vocational Grants', description: 'Skills training and vocational education funding' },
      { id: 'sme-support', name: 'SME Support', description: 'Small and medium enterprise development' },
      { id: 'financial-literacy', name: 'Financial Literacy', description: 'Financial education and literacy programs' }
    ]
  },
  {
    id: 'housing-infrastructure',
    name: 'Housing & Infrastructure',
    description: 'Housing solutions and infrastructure development',
    icon: '🏠',
    subcategories: [
      { id: 'affordable-housing', name: 'Affordable Housing', description: 'Low-cost housing solutions' },
      { id: 'green-building', name: 'Green Building', description: 'Sustainable construction and architecture' },
      { id: 'emergency-shelter', name: 'Emergency Shelter', description: 'Temporary housing for emergencies' },
      { id: 'urban-renewal', name: 'Urban Renewal', description: 'City development and revitalization' }
    ]
  },
  {
    id: 'food-agriculture',
    name: 'Food & Agriculture',
    description: 'Food security and agricultural development',
    icon: '🌾',
    subcategories: [
      { id: 'sustainable-farming', name: 'Sustainable Farming', description: 'Environmentally friendly agriculture' },
      { id: 'nutrition-programs', name: 'Nutrition Programs', description: 'Food security and nutrition initiatives' },
      { id: 'agritech', name: 'AgriTech', description: 'Agricultural technology solutions' },
      { id: 'community-gardens', name: 'Community Gardens', description: 'Local food production initiatives' }
    ]
  },
  {
    id: 'arts-culture',
    name: 'Arts & Culture',
    description: 'Creative expression and cultural preservation',
    icon: '🎨',
    subcategories: [
      { id: 'creative-grants', name: 'Creative Grants', description: 'Funding for artistic projects' },
      { id: 'cultural-preservation', name: 'Cultural Preservation', description: 'Heritage and tradition conservation' },
      { id: 'indigenous-knowledge', name: 'Indigenous Knowledge', description: 'Traditional knowledge systems' },
      { id: 'media-impact', name: 'Media Impact', description: 'Media for social change' }
    ]
  },
  {
    id: 'digital-access',
    name: 'Digital Access & Innovation',
    description: 'Technology access and digital inclusion',
    icon: '💻',
    subcategories: [
      { id: 'broadband-equity', name: 'Broadband Equity', description: 'Internet access for underserved communities' },
      { id: 'civic-tech', name: 'Civic Tech', description: 'Technology for civic engagement' },
      { id: 'open-source-tools', name: 'Open Source Tools', description: 'Free and open technology solutions' },
      { id: 'ai-stem-underserved', name: 'AI/STEM for Underserved', description: 'Advanced technology education for marginalized communities' }
    ]
  },
  {
    id: 'climate-environment',
    name: 'Climate & Environment',
    description: 'Environmental protection and climate action',
    icon: '🌍',
    subcategories: [
      { id: 'renewable-energy', name: 'Renewable Energy', description: 'Clean energy solutions' },
      { id: 'conservation', name: 'Conservation', description: 'Environmental protection initiatives' },
      { id: 'climate-resilience', name: 'Climate Resilience', description: 'Climate adaptation and mitigation' },
      { id: 'circular-economy', name: 'Circular Economy', description: 'Sustainable resource management' }
    ]
  },
  {
    id: 'justice-governance',
    name: 'Justice & Governance',
    description: 'Legal aid and governance reform',
    icon: '⚖️',
    subcategories: [
      { id: 'legal-aid', name: 'Legal Aid', description: 'Legal assistance and representation' },
      { id: 'civic-engagement', name: 'Civic Engagement', description: 'Community participation in governance' },
      { id: 'anti-corruption-tech', name: 'Anti-Corruption Tech', description: 'Technology for transparency and accountability' },
      { id: 'restorative-justice', name: 'Restorative Justice', description: 'Alternative justice and rehabilitation' }
    ]
  },
  {
    id: 'mental-wellness',
    name: 'Mental Wellness & Belonging',
    description: 'Mental health and community belonging',
    icon: '🧠',
    subcategories: [
      { id: 'trauma-informed-care', name: 'Trauma-Informed Care', description: 'Trauma-sensitive support services' },
      { id: 'interfaith-dialogue', name: 'Interfaith Dialogue', description: 'Religious and spiritual community building' },
      { id: 'identity-support', name: 'Identity Support', description: 'Support for identity and belonging' },
      { id: 'community-healing', name: 'Community Healing', description: 'Collective healing and reconciliation' }
    ]
  }
];

export const getCategoryById = (id: string) => {
  return categories.find(category => category.id === id);
};

export const getSubcategoryById = (categoryId: string, subcategoryId: string) => {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(sub => sub.id === subcategoryId);
};