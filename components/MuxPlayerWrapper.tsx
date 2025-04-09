'use client';

import dynamic from 'next/dynamic';

const MuxPlayer = dynamic(() =>
  import('@mux/mux-player-react').then(mod => mod.default), {
    ssr: false,
  }
);

export default MuxPlayer;
