export class CreateVerseDto {
  reference: string;
  author: string;
  tags: string[];
  kjv_text: string;
  first_person_version: string;
  closing_text?: string;
  character_id: string;
  character_avatar_id?: string;
}
