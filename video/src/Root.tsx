import { Composition } from 'remotion';
import { AnclaIAVideo } from './AnclaIAVideo';

// FPS y duración total
const FPS = 30;
// Slides: 7 escenas × ~5 segundos = ~35s + intro 4s + outro 4s = ~43s
const DURATION_IN_FRAMES = FPS * 46;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="AnclaIAVideo"
        component={AnclaIAVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{}}
      />
    </>
  );
};
