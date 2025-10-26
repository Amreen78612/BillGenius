
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';

export default function RootPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'home-hero');

  return (
    <div className="relative h-screen w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt="Abstract background"
          fill
          className="object-cover"
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center bg-black/50">
        <div className="text-center">
          <h1 className="font-headline text-6xl font-bold text-white">
            BillGenius
          </h1>
          <p className="mt-4 text-xl text-white/80">
            Smart billing software for modern businesses.
          </p>
        </div>
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
