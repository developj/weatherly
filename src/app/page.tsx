import Image from "next/image";
import WeatherMap from "@/components/WeatherMap/WeatherMap";
export default function Home() {
  return (
    <div className="font-sans">
      <main className="w-full">
      
       <WeatherMap />

        
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
       
        
      </footer>
    </div>
  );
}
