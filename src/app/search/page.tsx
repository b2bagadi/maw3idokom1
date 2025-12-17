import { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
    title: 'Search - Maw3idokom',
    description: 'Search for businesses, salons, mechanics, and more on Maw3idokom.',
};

export default function SearchPage() {
    return <SearchClient />;
}
