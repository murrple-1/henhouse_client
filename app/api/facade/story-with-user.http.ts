import { User, userLookup } from '~/api/http/auth.http';
import { SortField, getStories, getStory } from '~/api/http/story.http';
import { QueryOptions } from '~/api/query.interface';
import { Page } from '~/api/utils.lib';

export interface StoryWithUser {
  uuid: string;
  title: string;
  synopsis: string;
  username: string;
  userUuid: string;
  publishedAt: Date | null;
}

export async function getStoryWithUser(
  host: string,
  id: string,
  sessionId: string | null,
) {
  return getStory(host, id, sessionId).then(async story => {
    const users = await userLookup(host, [story.creator], sessionId);
    const user = users[0] as User;

    return {
      uuid: story.uuid,
      title: story.title,
      synopsis: story.synopsis,
      username: user.username,
      userUuid: user.uuid,
      publishedAt: story.publishedAt,
    } satisfies StoryWithUser;
  });
}

export async function getStoriesWithUsers(
  host: string,
  options: QueryOptions<SortField>,
  sessionId: string | null,
) {
  return getStories(host, options, sessionId).then(async stories => {
    const userUuids = new Set<string>(stories.items.map(s => s.creator));
    const users = await userLookup(host, Array.from(userUuids), sessionId);
    const userMap: Record<string, User> = {};
    for (const u of users) {
      userMap[u.uuid] = u;
    }
    return {
      items: stories.items.map(s_1 => {
        const user = userMap[s_1.creator] as User;
        return {
          uuid: s_1.uuid,
          title: s_1.title,
          synopsis: s_1.synopsis,
          username: user.username,
          userUuid: user.uuid,
          publishedAt: s_1.publishedAt,
        } satisfies StoryWithUser;
      }),
      count: stories.count,
    } as Page<StoryWithUser>;
  });
}
