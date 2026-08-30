// A short, low-stakes distraction to reach for mid-exposure — not an excuse to
// leave the exposure, just something small to hold attention for a moment
// while a SUDs spike runs its course.
export const FOX_FACTS: string[] = [
  'Foxes can hear a mouse squeak from about 100 feet away.',
  'A fox uses its bushy tail — called a "brush" — like a blanket to keep its nose warm while sleeping curled up in winter.',
  'Foxes can make around 40 different sounds, including a scream-like call used during mating season.',
  'Red foxes are found on every continent except Antarctica.',
  'A group of foxes is called a "skulk" or a "leash."',
  'Foxes are members of the dog family, but they hunt more like cats — pouncing on prey from above.',
  'A fox\'s eyes have vertical, slit-shaped pupils, just like a cat\'s, which helps them see well in low light.',
  'Foxes appear to use the Earth\'s magnetic field to help judge distance when pouncing on prey hidden under snow.',
  'Baby foxes are called kits, cubs, or pups.',
  'Foxes have whiskers on their legs, not just their face, which helps them feel their way through tight spaces.',
  'The fennec fox, the smallest fox species, has ears almost as big as its whole head to help it release heat in the desert.',
  'Foxes are mostly solitary hunters, unlike wolves, which hunt in packs.',
  'A fox can run at speeds of up to 30 miles per hour.',
  'Foxes bury extra food in small holes called caches, and remember hundreds of hiding spots.',
  'Arctic foxes grow a completely different, thicker coat for winter that can be twice as warm as a wolf\'s fur.',
  'Some fox species, like the gray fox, can climb trees.',
]

export function pickRandomFoxFact(exclude?: string): string {
  const options = exclude ? FOX_FACTS.filter((f) => f !== exclude) : FOX_FACTS
  const pool = options.length > 0 ? options : FOX_FACTS
  return pool[Math.floor(Math.random() * pool.length)]
}
