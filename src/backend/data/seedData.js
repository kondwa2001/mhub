export const donorOpportunities = [
  { id: 'om', initials: 'OM', name: 'Omidyar Network', focus: 'Inclusive technology & entrepreneurship', region: 'Global · Africa', match: 94, deadline: 'Rolling', tone: 'green' },
  { id: 'mf', initials: 'MF', name: 'Mastercard Foundation', focus: 'Youth work & digital economies', region: 'Africa', match: 91, deadline: '30 May 2026', tone: 'orange' },
  { id: 'gi', initials: 'GI', name: 'Global Innovation Fund', focus: 'Climate & social innovation', region: 'Low-income countries', match: 88, deadline: '18 Jun 2026', tone: 'purple' },
]
/** Placeholder collaborator directory so matching is usable before the
 * Firestore `collaborators` collection is populated. These are illustrative
 * organisation types, not a record of anyone's real commitments to mHub --
 * replace them with the actual partner list before showing this to anyone. */
export const collaboratorDirectory = [
  {
    id: 'seed-national-ict',
    name: 'National ICT authority',
    summary: 'Public body backing digital skills rollout and connectivity across the country.',
    focusTags: ['ict', 'digital-skills', 'education'],
    supportTypes: ['funding', 'infrastructure'],
    regions: ['Malawi'],
  },
  {
    id: 'seed-youth-fund',
    name: 'Youth enterprise fund',
    summary: 'Grants and seed capital for young founders moving from prototype to first revenue.',
    focusTags: ['youth', 'entrepreneurship', 'finance', 'jobs'],
    supportTypes: ['funding', 'mentorship'],
    regions: ['Malawi', 'Africa'],
  },
  {
    id: 'seed-university',
    name: 'University innovation faculty',
    summary: 'Research partner supplying student cohorts, lab space and evaluation capacity.',
    focusTags: ['innovation', 'education', 'ict'],
    supportTypes: ['research', 'infrastructure', 'training'],
    regions: ['Malawi'],
  },
  {
    id: 'seed-telecom',
    name: 'Regional telecom operator',
    summary: 'Connectivity, devices and market reach for ventures scaling to rural users.',
    focusTags: ['ict', 'jobs'],
    supportTypes: ['infrastructure', 'market-access', 'funding'],
    regions: ['Malawi', 'Africa'],
  },
  {
    id: 'seed-women-network',
    name: "Women in technology network",
    summary: 'Mentors and role models for girls and female founders entering the tech economy.',
    focusTags: ['women-girls', 'digital-skills', 'mentorship', 'youth'],
    supportTypes: ['mentorship', 'training'],
    regions: ['Africa'],
  },
  {
    id: 'seed-agri-institute',
    name: 'Agricultural development institute',
    summary: 'Sector expertise and field access for ventures working with smallholder farmers.',
    focusTags: ['agritech', 'climate', 'innovation'],
    supportTypes: ['research', 'market-access'],
    regions: ['Malawi'],
  },
  {
    id: 'seed-climate-fund',
    name: 'Climate innovation fund',
    summary: 'Finance for clean energy and climate-resilience ventures in low-income markets.',
    focusTags: ['climate', 'innovation', 'finance'],
    supportTypes: ['funding'],
    regions: ['Global'],
  },
  {
    id: 'seed-health-ngo',
    name: 'Community health NGO',
    summary: 'Delivery partner for health-adjacent digital tools reaching district clinics.',
    focusTags: ['health', 'ict'],
    supportTypes: ['market-access', 'training'],
    regions: ['Malawi'],
  },
]

export const mhubActivities = [
  { date: '14', month: 'MAY', dueAt: '2026-05-14T08:00:00.000Z', type: 'Programme', title: 'Startup incubation sprint', copy: 'A practical week for early-stage founders building high-impact ventures.', status: 'This week' },
  { date: '22', month: 'MAY', dueAt: '2026-05-22T08:00:00.000Z', type: 'Community', title: 'Open innovation meetup', copy: 'Connecting builders, mentors, researchers and partners in Lilongwe.', status: 'Upcoming' },
  { date: '04', month: 'JUN', dueAt: '2026-06-04T08:00:00.000Z', type: 'Training', title: 'Digital skills lab', copy: 'Hands-on learning for young people entering the digital economy.', status: 'Upcoming' },
]
