import { Composition } from 'remotion';
import { AnclaIAVideo } from './AnclaIAVideo';
import { YachtJourneyVideo } from './YachtJourneyVideo';

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="AnclaIAVideo"
        component={AnclaIAVideo}
        durationInFrames={FPS * 52}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{}}
      />
      <Composition
        id="YachtJourneyVideo"
        component={YachtJourneyVideo}
        durationInFrames={FPS * 73}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{}}
      />
    </>
  );
};
