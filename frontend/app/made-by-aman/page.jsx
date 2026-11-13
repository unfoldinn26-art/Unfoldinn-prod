import AnimatedShowcase from '../../components/made-by-aman/AnimatedShowcase';

export const metadata = {
  title: 'Made by Aman | Engineering & Architecture of Unfoldinn',
  description:
    'Discover how Aman Pratap Singh engineered Unfoldinn from the ground up — 15 core infrastructure layers, Elephant + Goldfish concurrency, AES-256-GCM DR Vault, and DPDP 2023/2025 compliance.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/made-by-aman',
  },
  openGraph: {
    title: 'Made by Aman | Engineering & Architecture of Unfoldinn',
    description:
      'Every layer of Unfoldinn designed and built from scratch by Aman Pratap Singh.',
    url: 'https://www.unfoldinn.com/made-by-aman',
    images: [{ url: '/aman-pratap-singh.jpg' }],
  },
};

export default function MadeByAmanPage() {
  return <AnimatedShowcase />;
}
