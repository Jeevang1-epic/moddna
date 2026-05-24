import { Card, SectionTitle } from '../../../components/ui';

export const ConstitutionBuilderScreen = () => (
  <Card className="space-y-4">
    <SectionTitle>Constitution Builder</SectionTitle>
    <p className="text-sm text-zinc-700">
      This view is prepared for rule codification workflows and policy
      refinement.
    </p>
    <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
      <li>Principle drafting surface shell</li>
      <li>Conflict detection result region</li>
      <li>Versioned moderation guidance region</li>
    </ul>
  </Card>
);
