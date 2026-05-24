import { Card, SectionTitle } from '../../../components/ui';

export const TimeMachineScreen = () => (
  <Card className="space-y-4">
    <SectionTitle>Time Machine</SectionTitle>
    <p className="text-sm text-zinc-700">
      This view is prepared for historical case exploration workflows and
      precedent retrieval output.
    </p>
    <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
      <li>Historical moderation timeline shell</li>
      <li>Case comparison layout region</li>
      <li>Explanation trace panel region</li>
    </ul>
  </Card>
);
