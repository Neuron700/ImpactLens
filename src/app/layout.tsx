import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'ImpactLens — See the impact before you decide',description:'Transparent scenario comparison for product decisions.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
