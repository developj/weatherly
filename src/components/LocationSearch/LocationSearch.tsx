import React, { useRef, useEffect, useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input, InputRef } from '@/components/Input';


interface LocationSearchProps {
  onLocationSelect: (location: google.maps.LatLng, address: string) => void;
  isMapLoaded: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, isMapLoaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isMapLoaded && inputRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current as HTMLInputElement, {
        types: ['(cities)'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setIsSearching(true);
          onLocationSelect(place.geometry.location, place.formatted_address || place.name || '');
          setSearchValue(place.formatted_address || place.name || '');
          setTimeout(() => setIsSearching(false), 1000);
        }
      });
    }
  }, [isMapLoaded, onLocationSelect]);

  const clearSearch = () => {
    setSearchValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef as React.Ref<InputRef>}
          placeholder="Search for a location..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="outlined"
            size="large"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border rounded-md shadow-lg">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <MapPin className="h-4 w-4 animate-pulse" />
            <span>Locating...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
