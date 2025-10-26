/**
 * Example file to test our strict TypeScript and ESLint configuration
 */

// This will trigger several linting errors to demonstrate the rules
export function exampleFunction(input: any): any {
  const result = input.someProperty;
  const array = [1, 2, 3];
  const firstItem = array[0];
  
  if (input) {
    console.log('This will be flagged');
  }
  
  return result;
}

// This shows proper typing (what we want)
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export function getUserById(id: string): User | undefined {
  const users: User[] = [];
  const user = users.find(u => u.id === id);
  return user;
}

export function processUser(user: User): string {
  return user.name ?? 'Unknown';
}
