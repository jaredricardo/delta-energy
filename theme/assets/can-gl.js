/* Delta Energy — shared WebGL can "turntable" spin, used by the shop (PDP)
   and ingredients sections. Ported verbatim from the Variant F mock: the two
   flavor labels are unwrapped onto a cylinder in a shader and the toggle
   animates the rotation (with motion blur) instead of swapping a flat image.
   Falls back to the caller's flat-flip spin() if WebGL/the textures aren't
   available (see `canGL` usage in section-home-shop.js /
   section-home-ingredients.js). */

;(function () {
  var TAU = Math.PI * 2
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // can geometry, encoded by the mock as a base64 R/G=x, B/A=y 16-bit raster
  // (one row per source-image scanline) — decoded straight into a WebGL
  // texture and sampled in the fragment shader to find the can's silhouette.
  var SPIN = { w: 382, h: 1051, body: 186.15, cen: [190.17, 528.09], e: [0.17, 0.15], geo: 'KDEFwSgxB3MoOAokKFgN3yh+EJ4oxBMEKSwVJCmWFxwp8RjzKlwabCqrG7kq4RznKx8d9ytfHwwroCAJK+4g+iwzIbYscyJTLLEi/yzcI98tFCS4LVIlRS2PJaYtzCYBLhEmfy4/JvEubSdhLpknyi7CKCgu4CiBLvso3S8YKT4vMSmcL0wp7y9qKjUviSp3L6Yqti/DKvAv3CsiL+8rWC//K4wwBCvBMAQsAy//LEMv+yx+L/osnjABLK4wCSy0MBEstjAXLLgwGiy6MBosuTAYLLYwGiyuMBwsoTAjLJEwLSx/MDosbDBILFYwVCw+MF0sJzBiLBgwYywTMF8sETBYLA8wTSwMMD8sCjAtLAkwFSwHL/wsAS/jK/svzCv1L7gr9C+qK/kvoSwBL5csCi+RLA8viywSL4QsHC9+LC8veCxGL3EsXS9pLG4vYSx6L1kshC9ULJUvTyypL0ssvC9ILMwvRizbL0Ms7C9BLQAvQS0UL0EtJi9CLTcvQy1HL0gtVy9MLWgvUS15L1UtjS9aLaAvXC2yL18twS9jLcovZi3WL2wt4C9xLekvdS3tL3gt9i98LgMvgS4OL4guEy+QLhQvmS4WL6EuGi+mLh0vqC4hL6wuIy+vLiUvsS4mL7QuJi+4LicvuS4oL7ouKi+8Liovvi4qL78uKy/BLiovwy4pL8UuKC/ILigvyy4oL80uKC/PLigv0C4pL9AuKi/RLiwv0S4tL9EuLi/QLi8vzy4vL80uLS/MLiwvyS4pL8cuKS/FLisvxC4sL8QuLi/GLi4vyC4tL8wuKC/PLiMv0y4gL9YuHS/ZLhov2y4YL9wuHS/ZLiIv1i4oL9QuKS/TLikv0y4oL9QuJC/WLiAv2C4cL9kuGS/bLhgv3S4YL94uGS/hLiAv4i4tL+YuPC/sLk0v+S5dMAcubDAWLngwJi6GMDIukDA4LpUwPC6VMD0ukzA6LoswLS57MBwuZTAILk8v9i4/L+YuNC/eLi8v3C4rL9wuKi/cLiov2y4rL9ouLC/WLisv0S4qL80uKi/ILikvyC4pL8ouLS/NLjYv0S5BL9cuSy/bLlYv3y5fL+MuZS/mLmgv6C5qL+gubC/vLm8v+i52MAkugjAYLpAwJi6cMC8upDA0Lq0wNS60MDYuujA3LrQwNC6mMCkukTAXLn0v/S5xL+EuZi/GLl8vsi5YL6UuVi+gLlUvoS5UL6MuUy+mLk8vqS5LL6wuRi+tLkMvrC5CL6suQC+pLj0vqC45L6YuOC+oLjcvrS47L7UuRC+9LlAvxS5YL8guWi/GLlYvwy5NL70uQi+5Ljwvti46L7MuOS+wLjgvrS43L6wuNy+tLjcvuC48L8QuTy/TLmYv4y57L/Eugi/1LoUv9i6IL/QuhC/xLoAv7S57L+Uudi/WLmsvxi5WL7YuQi+mLjYvmS40L5EuNi+MLjovhC5BL3wuSi9xLlQvZC5eL1cuay9MLn0vQS6MLzouly84LpovNy6aLzkumi8/LpcvSi6ML1oudy9qLlwveC5KL4QuQi+MLkMvjC5DL4wuRC+MLkMvjC5AL4ouPS+KLj0vii4+L4suQS+MLkQvji5GL48uRi+QLkYvkS5FL44uRC+MLkMvii5DL4guQy+ILkQvjC5GL48uSC+TLksvki5LL48uSi+LLkgvhC5GL30uQy94LkEvdC49L3EuOy9wLjovcS48L3MuPy92LkEvei5BL30uQS9/LkEvfy5CL30uQy99LkMvfS5DL38uQy+DLkcvhi5LL4guTy+KLk0vjC5ML4suSy+KLkwviC5NL4YuTy+ELk8vhC5QL4UuUS+FLlMvhS5WL4UuWS+ELlwvhi5cL4guWi+KLlYvjC5RL40uTy+NLk8vjC5PL4ouUi+ILlYvii5bL4wuXi+PLl8vki5cL5QuWC+RLlQvjS5TL4kuVS+ELlcvgC5aL4EuWy+DLlwvhy5dL4wuXS+RLl0vli5dL5guXS+bLmAvnS5kL50uaS+dLmwvnC5sL5guai+ULmMvkS5cL48uWC+OLlYvkC5WL5MuVi+WLlovmi5hL50uai+fLnEvoi50L6Eucy+dLm4vmi5pL5guZC+YLmUvmy5oL50uai+hLm0voS5tL54ubS+aLmkvli5kL5IuYC+NLl8vii5dL4guXS+GLl8vhC5iL4QuZC+ELmYvgy5tL4EufS99Lo8veC6eL3Aupy9mLqwvXS6yL1YutS9RLrgvUC64L1QuuC9bLrUvZi6qL3YunS+GLo0vlC6DL6Euei+oLnUvqi5yL6kuby+nLm8vpS5wL6QucS+lLnMvpy5zL6oucy+qLnIvqy5xL6oucS+pLm8vqS5vL6oubi+qLm8vqy5zL6wudy+rLnovqi55L6oudi+pLnQvqS50L6oudC+qLncvqi56L6kufS+oLn0vpi58L6YufC+mLnwvpi59L6YufS+lLn0voy59L6EufC+dLnkvnC50L5oubi+YLmovmC5mL5guaS+ZLm8vmi52L5wufS+eLoMvoC6HL6Euii+hLosvoC6JL58uhi+eLoEvni5+L58ufC+gLnwvoS58L6Muei+kLncvpS50L6Yuci+mLnEvpy5xL6Yuci+lLnEvpC5xL6IucS+gLnIvny5xL50ucS+aLm4vli5sL5MuaC+PLmovjS5sL40uci+PLnovlC6EL5ouiy+fLo8vpC6NL6cuiC+oLoEvpi59L6QufC+iLn0voC5+L58ufy+fLoAvny6AL6Aufy+hLn0voC58L6AufC+gLnovny54L6Eudy+iLncvoy54L6Quei+lLnwvpC59L6MufS+hLn0voy5+L6gugi+uLoovtC6SL7ouly+9LpgvvS6YL7gumC+zLpEvrS6LL6guhC+lLoQvpi6EL6guhC+oLoQvqS6DL6gugy+qLoMvrC6FL7Auii+zLo0vuC6QL7suky+9Lpcvvi6bL78umy+/LpgvvC6UL7oujy+3Lowvsy6NL68ujS+tLo4vqy6ML6kuii+pLogvrC6KL68ujC+zLo0vtS6ML7Yuhi+0LoEvsi58L7Aufi+vLoEvsC6EL7Euhi+yLocvsS6IL7AuiS+uLokvrC6IL6kuiC+oLoovqi6ML68uky+0LpovuC6hL7wuoS+6LqAvti6fL7MuoS+vLqYvri6sL60usC+tLrAvrS6wL60uqC+rLpwvqC6RL6YujS+jLo0voy6NL6QujC+mLowvqS6KL6wuiS+tLogvri6IL64uii+tLo8vrC6UL6oumC+nLpovpC6cL6MunS+iLqAvoS6kL6Iupi+iLqgvoi6lL6Iuoi+iLp8voS6gL6EuoS+hLqEvoS6eL6EunC+iLpgvoy6YL6QumS+jLpovoS6cL6Auny+fLqAvny6hL6Euny+jLp0vpi6cL6kumy+rLpkvrC6YL60umC+tLpgvrC6aL6sunS+qLqEvqC6kL6YupS+iLqMvnS6hL5guny+ULp8vki6fL5QunS+WLp0vmi6cL58unC+iLp0vpC6eL6Uuni+lLpwvoS6aL50uly+YLpgvky6ZL44umi+MLpovjC6bL4sumi+LLpovjC6aL48umi+TLpkvly6ZL5sunC+dLp8vnS6kL54upi+fLqcvoC6oL6IurC+kLrQvpi69L6guwy+rLsYvrS7EL7Auwy+zLr8vtC67L7cuti+4LrMvuC6xL7UusC+xLq8vrS6vL6kuri+mLq4vpC6vL6QusS+kLrEvpC6xL6gury+rLqwvri6oL7IupS+1LqUvti6mL7Yupi+1LqcvtS6pL7Muqi+tLq0vpi60L50uwS+TLs4vii7YL4Qu3C+ALtwvfy7bL4Qu1y+OLs8vmC7FL6Muui+tLrEvri6qL60uqC+rLqovqS6sL6gusC+oLrUvqi65L6suuy+sLrovrS64L60utS+vLrEvry6uL68urS+vLqwvry6sL64urC+uLqwvrS6sL6wuqy+qLqovqC6nL6YupC+lLqMvpi6jL6ouoy+uLqMvsy6iL7YuoS+5LqAvuC6fL7Yuny+0Lp4vsS6eL6wunS+nLpwvoy6cL58unS+dLqEvnS6oL58ury+gLrMvoi60L6MutC+kLrMvpi6xL6gusC+pLq8vqS6vL6gury+mLq8vpi6xL6Qusy+lLrYvpi65L6Yuui+kLrkvoS62L54usS+bLqsvmS6oL5guqC+aLqovmi6rL5ouqy+WLqovki6pL40uqC+ILqovhC6rL4IurC+BLqwvgi6sL4IurS+GLq0vii6xL44utC+SLrgvlS64L5Uuui+ULrovky67L5Muuy+SLrovkS65L48uuC+NLrYvjC62L4outi+KLrMvii6wL4wurS+NLq0vjy6vL5EusS+RLrIvkS6xL48usS+NLq8vjC6xL4wutC+PLrgvky67L5ouvC+kLsMvry7OL7wu2i/ILuYv0y7yL9ou/y/gLwYv4S8IL9wvBi/RLv8vwS7tL7Au1S+fLsEvkS62L4gusy+ELrMvgi6zL4IusS+DLq8vgy6uL4UusC+HLrQviS66L4ouvy+KLsMviS7DL4cuxC+ELsUvgi7GL4AuyC99Lsgvei7JL3YuzC9tLs8vZC7XL1ou4C9OLu0vQi78LzovBy80Lw4vMS8RLzMvES85Lw8vQS8GL00u9i9YLuUvYi7ZL2ou0y9xLs8vdi7ML3kuxy98LsMvfS6/L34uwS99LsYvfC7ML3wu0S9/LtUvgy7aL4Yu3S+GLt8vhC7fL4Eu3S98Ltkvei7UL30u1C+DLtoviC7hL40u6C+RLuovkC7oL40u4y+HLtsvgi7WL30u1C95LtQvdy7TL3Yu1C91LtYvci7YL2wu2i9jLt8vWi7lL1Iu7C9KLvEvRC7zLz4u9C85LvQvNC70LzIu9C80LvEvOS7sLz8u5y9JLuMvVC7cL14u1C9nLs8vby7OL3Uuzi94Ls8vey7PL30uzi9/LswvgC7JL4Euxi+BLsgvgi7ML4Mu0C+ELtMvhC7SL4Qu0i+ELtEvgy7QL4Euzy9/Ls8vfy7PL38u0C9/LtIvfy7UL38u1y9+LtkvfS7ZL30u2i99LtovfS7ZL30u2S97Ltkvdy7ZL3Qu2C9xLtgvby7XL28u1i9wLt0vcS7kL3Mu6y9zLuwvcy7sL3Iu6i9zLukvci7rL3Iu7S9xLu8vci7yL3Mu+C90LwIvdS8LL3YvDy92LxEvdC8OL3MvCS9xLwQvcC8BL3AvAC9uLv0vbC76L2ku+C9mLvgvYy74L2Eu+C9fLvcvXi7yL10u7C9dLuIvXS7YL10uzy9eLsYvXy66L18uqi9fLpgvYC6FL2EucS9iLlgvYy42L2MuEi9hLecvXy24L10tey9bLTYvVyznL1MslS9PLD0vRyviLz8rcy85KwovMyqbLy8qPS8xKd8vNSmWLzwpXy9DKTMvSykML1Ao6i9VKMwvWCiyL1oomi9aKIEvWShiL1UoQS9PKBovRiftLz0nti80J3cvLCcnLyQmyi8eJlwvEyXkLwUlVC70JK4u2iPdLr0i8y6mIfcukyD8LoQfzC6AHmcugxy2LoQa0C6NGIguwxWNLvkRtS8sCmovXwRzL44AQA==' }
  var ING_SPIN = { w: 465, h: 1025, body: 187.03, cen: [230.43, 508.99], e: [-0.02, -0.125], geo: 'Og0aoDoNGqA6DRqgOfcdnTncIoE5wCgvOaQrGTmILC85giyAOYEsmzmBLKE5gSyjOYIsozmDLKE5hSydOYYsljmJLIs5iyx6OY0sSjmPLBk5kCvcOY8rrzmNK4Q5iytuOYkraTmGK2o5hituOYYreDmGK4Y5hiuUOYYrnzmGK6s5hiu8OYYrzzmGK+Q5hyv5OYcsDzmHLCY5iCw/OYcsWjmGLHU5hSyROYQssTmDLM05gyzvOYItDDmCLS85gS1MOYEtcTmBLY85gS2yOYItzTmDLe05hC4FOYQuHzmGLjc5hi5NOYYuYjmGLnY5hi6KOYcumDmKLqE5jS6uOY8uvDmRLsk5ki7ROY8u1TmLLtY5hy7WOYQu1TmCLtQ5gS7UOYEu1DmDLtM5gy7SOYQu0TmELs85hC7ROYQu0zmGLtQ5ii7aOY8u4jmULuo5ly7vOZYu7DmRLuQ5jC7cOYcu2DmELtc5hC7XOYQu1zmELtc5hC7YOYQu2DmELtg5hC7ZOYQu2TmFLtk5hi7YOYgu2DmJLtg5ii7YOYwu1zmNLtY5ji7UOY8u0jmQLtE5kS7ROZAu0TmPLtI5jy7TOY4u1DmNLtM5jS7TOY4u0jmPLtE5kC7ROZEu0DmULtA5my7TOaMu3DmtLug5ui70OcYvADnQLwo52i8TOeIvGjnoLyE57S8mOfEvKTnyLyo58S8qOe0vKDnpLyI54y8aOdovETnPLwc5wS75ObIu5DmkLtQ5mS7IOZEuxzmPLsc5jy7GOY8uxjmPLsY5jy7GOY8uxjmPLsY5jy7GOY8uxjmPLsY5kC7GOZAuxjmQLsY5kC7GOZAuxjmRLsY5kS7GOZEuxjmRLsY5lS7HOZ0uzTmoLto5ti7sOcQu/DnRLwg52C8POd0vEjneLxM53S8TOdcvETnNLwo5vi79Oa8u6DmhLtU5li7KOY8uyDmNLsc5jS7GOY0uxjmOLsU5jy7FOY8uxTmPLsU5jy7FOY8uxTmPLsU5ji7GOY0uxjmNLsY5jS7GOY4uxjmOLsY5jy7GOY8uxjmPLsY5jy7GOY8uxjmPLsY5jy7GOY8uxzmPLsc5kC7HOZAuxjmRLsU5kS7DOZIuwTmSLsA5ki7BOZEuwTmQLsM5jC7DOYQuyDl4LtU5aC7qOVYvADlGLxE5Oi8cOTEvIzktLyg5Ki8rOSwvKjkxLyY5Oi8fOUsvEDlfLvk5cS7fOYAuzTmLLsY5jy7GOY8uxTmPLsQ5jy7EOY8uxDmMLsU5iS7KOYYuzzmGLtQ5hi7POYkuyjmMLsU5jy7EOZAuxDmQLsQ5kC7EOZAuxDmQLsM5kS7DOZEuwjmSLsE5ky7BOZQuwDmULsA5lS7AOZYuwDmWLsE5li7COZUuxDmULsQ5ky7FOZEuxTmQLsQ5kS7EOZUuxjmZLsk5nS7MOaEuzTmhLsw5ny7IOZwuxDmZLsA5li69OZUuvDmWLrs5ly66OZguuDmZLrg5mi64OZouujmcLrw5nC6+OZ0uwTmeLsE5nS7COZ0uwTmcLr85mi69OZouvTmaLr05mi69OZouvTmaLr05mi69OZouvTmZLr05mS69OZkuvTmZLr05mS69OZkuvDmZLrw5mS68OZouvDmaLr05mi69OZouvTmXLr85kS7EOYguzzl9Lt85dC7qOW0u8TlsLvE5cC7sOXku5DmCLtY5jC7MOZQuxDmZLsI5nC7AOZ0uvzmeLsA5ny7AOZ8uwDmfLsA5oC7BOaAuwTmgLsE5oS7BOaEuwTmhLsE5oS7BOaEuwTmhLsI5oS7COaEuwjmhLsI5oi7COaIuwjmiLsI5oy7COaMuwjmjLsM5oi7DOaIuwzmiLsM5oi7EOaEuxDmhLsQ5oS7EOaEuwzmiLsM5oy7BOaUuvzmmLr05qC68OakuvDmoLr05qC6+OacuvzmmLsA5oy7BOaAuxDmdLsc5my7KOZkuyjmZLso5mC7JOZMuzDmKLtQ5fy7jOXIu9DlkLwI5Wi8MOVQvEzlQLxY5US8WOVYvETlcLwo5Zi8AOXQu8zmCLuQ5jy7UOZouzDmiLsg5py7JOaguyjmpLso5qC7IOaYuxjmjLsM5oS7BOaAuvzmfLr45ny69OZ8uvTmgLr45oS6/OaEuwDmiLsE5oi7BOaIuwTmiLsE5oi7BOaEuwTmhLsE5oS7BOaEuwTmhLsI5oC7COaAuwzmfLsM5ny7DOZ8uxDmeLsQ5ni7EOZ4uxDmeLsQ5nS7EOZ0uxDmdLsQ5nS7FOZ0uxTmdLsU5nS7FOZ0uxjmdLsY5nS7GOZ0uxjmdLsY5nC7GOZwuxjmcLsc5nS7HOZ0uyDmdLsg5nS7IOZ0uyDmeLsg5nS7HOZ0uxjmdLsY5nS7FOZ0uxTmdLsU5nC7FOZwuxjmcLsY5nC7GOZwuxjmcLsY5nC7GOZwuxTmcLsQ5nC7EOZwuxDmdLsQ5nS7DOZ0uwzmeLsM5ni7COZ4uwjmeLsM5nS7DOZ0uxDmcLsQ5nC7EOZsuxDmbLsQ5my7EOZsuxDmbLsQ5my7GOZsuxjmaLsc5mi7HOZouxzmaLsc5my7GOZwuxjmcLsU5nS7EOZ4uwzmfLsE5oC7BOaEuwTmhLsE5oS7AOaEuwDmhLsA5oS6/OaEuvzmhLr85oy7AOaMuwTmkLsM5pi7EOaYuxDmmLsQ5pC7COaMuvzmiLr05oS68OaEuuzmhLrs5oS66OaEuujmhLro5oS66OaEuujmhLro5oS67OaAuuzmgLrs5oS67OaEuuzmhLrs5oS67OaIuuzmiLrs5oi67OaMuuzmjLrw5oy69OaQuvTmkLr45pC6+OaQuvTmkLr05pC68OaQuvDmkLrw5pC68OaUuvDmmLr45qi7AObEuxjm9LtE5yi7lOdku9znmLwQ57i8LOfIvDznyLxE58C8OOewvCjnjLwI51S73OcYu5Dm4LtA5rC7COaMuvjmhLr45oS6+OaAuvjmgLr05oC69OaAuvTmgLr05oC69OaAuvTmgLr05oC69OaAuvDmgLrw5oC68OaAuvTmgLr45ny6+OZ8uvTmfLr05ny69OZ8uvTmeLr05nS6+OZ0uvzmcLsA5nC7AOZ0uwTmgLsE5pi7EOa0uzTm2Ltc5wC7hOccu5jnMLuo5zS7sOc0u6znKLuk5wS7jObgu1DmvLsc5py6/OaIuvTmiLr05oi69OaIuvDmiLrw5oi68OaMuvTmjLr85pC7BOaMuwTmjLsE5oi7AOaEuvzmhLr85oS6/OaEuvzmhLr85oC6/OaAuvzmgLr85ny6/OZ8uvzmgLsA5oC7BOaAuwTmfLsE5ny7AOZ4uvzmdLr85nS6+OZ0uvTmdLr05nS69OZ0uvTmdLr05nS69OZ0uvjmdLr45nS6+OZ0uvjmdLr45ni6+OZ4uvjmeLr45ni6+OZ4uvTmeLr05ni69OZ4uvTmeLr45ni6+OZ4uvzmeLr85ni6/OZ0uwDmbLsI5ly7IOZEu0DmGLto5ei7oOW8u9jlkLwE5XS8GOVovCDlYLwo5WC8KOVkvCDlbLwY5Xy8DOWou/Dl3Lu05hC7aOZAuyjmaLsQ5ny7DOaEuwDmjLr45pC69OaQuvTmkLrw5pC68OaQuvDmkLrw5pC68OaMuvDmjLrw5oy68OaMuvDmjLr05oy69OaIuvzmiLr85oS6/OaEuvzmhLr85oS7AOaEuwDmgLsE5oC7BOaAuwTmgLsE5oC7BOZ8uwjmfLsI5nS7BOZwuvzmaLr05mC68OZYuvzmULsU5ki7LOZEuzjmSLsw5lC7IOZguxDmaLsM5nC7DOZwuwzmcLsM5nC7COZ0uwjmdLsE5nS7BOZ0uwTmeLsA5ni7BOZ8uwTmfLsE5ny7BOZ8uwTmfLsE5ny7BOZ8uwTmfLsE5ny7BOZ8uwTmfLsE5ny7BOaAuwTmgLsE5oC7BOaAuwTmgLsI5ni7COZguxDmMLs85fS7jOW0u+DlcLwg5UC8SOUovGTlILxw5TS8WOVgvDDlqLvk5fC7iOYsuzjmXLsQ5ni7EOZ4uxDmfLsQ5ny7EOZ8uxDmfLsQ5ny7EOZ8uxTmfLsU5ni7FOZ0uxTmdLsQ5nS7EOZwuxDmcLsQ5mi7EOZYuxzmSLs05jS7UOYgu2TmFLtw5gy7eOYMu3zmDLt45hi7dOYsu2DmQLtE5lC7KOZkuxjmbLsU5nC7FOZwuxTmcLsU5nC7FOZwuxTmcLsU5oS7GOakuzDm2Lto5xS7tOdQu/TnhLwo56i8QOe0vEzntLxQ57C8UOekvEjnlLw853S8KOc8u/znBLuw5sy7WOacuyDmhLsQ5oy7GOaguzDmtLtI5sS7YObMu2DmvLtQ5qy7OOaYuxjmiLsM5oC7DOZ8uwzmgLsQ5oC7EOaEuxDmhLsQ5oS7EOaEuxDmhLsQ5oS7DOaIuwzmjLsQ5pC7GOaQuxzmkLsg5pC7GOaMuxDmhLsI5oC7BOaAuwjmgLsM5oC7DOaAuxDmfLsU5mi7GOZMuzjmKLtg5gS7lOXYu7DlvLvM5ai76OWgu/zlnLwM5ai8JOW4vFjlzLyQ5ei8zOYIvPDmLL0E5mC9EOaYvPjm0LzI5vy8eOccvDDnHLvk5wC7oObgu1DmwLsc5qC7AOaMuvzmiLr85oi6/OaEuvzmhLr85oS6/OaEuvzmhLr85oC6/OaEuvzmhLr85oS6/OaEuvzmhLr85oS6/OaEuvjmhLr45oC6+OaAuvjmgLr45oC6+OaEuvjmkLr85py7DOaou0DmtLuE5rC70OaQvBzmYLxc5hy8gOXMvIjlhLyA5VC8eOUovHDlGLxw5Ry8cOUwvGDlWLxE5Zi8BOXku6jmJLtI5ly7DOZ8uvzmhLr85oS6/OaEuvzmgLr85ny6/OZ8uvzmgLr85oC6/OaEuvzmhLr85oS6/OaEuvzmhLr85oS6/OaIuvzmoLsE5rS7KObMu1zm6LuM5vS7mObgu5jmyLt05rC7ROaYuwzmhLr05oS69OaEuvTmhLrw5oC68OZ8uvDmfLr05ny69OZ8uvTmfLr05ny69OZ8uvDmfLrw5ny67OaAuujmgLrg5oC63OaAutjmgLrY5oC61OaAutDmgLrM5oC6zOaMuszmnLrY5qy69Oa8uwzmxLsU5rC7COaUuuzmdLrQ5li6wOZEurzmTLqo5mC6fOZwukzmgLoc5pC58OaQuajmlLlU5pS42OaUuEDmmLe05pC3YOaQtzDmjLbQ5oS2aOaAtczmfLVA5ny0qOZ4tDzmhLOM5pCyNOaMr8TmhK0g5nSrBOZYqbDmPKh85jSnLOYspijmNKVw5kCk1OZQpDzmXKOs5mijNOZsoqjmaKIw5mihtOZkoUDmVKCw5kSgGOY0n1zmKJ6E5iidgOY0nEzmRJrM5lCY0OZkllDmdJNc5oiQBOacjEDmsIfQ5qCCwOZ8fJTmVHXg5iBuOOX4ZMjmDFh05ixFROZMKhTmdBQU5pQHxOaUB8TmlAfE=' }

  function loadImg (src, n) {
    n = n || 0
    return new Promise(function (ok, no) {
      var im = new Image()
      im.onload = function () { (im.decode ? im.decode().catch(function () {}) : Promise.resolve()).then(function () { ok(im) }) }
      im.onerror = function () {
        if (n < 2) setTimeout(function () { loadImg(src.split('?')[0] + '?r=' + (n + 1) + '-' + Date.now(), n + 1).then(ok, no) }, 600 * (n + 1))
        else no()
      }
      im.src = src
    })
  }

  var texCache = {}

  function makeCanGL (cfg, imC, imP) {
    var cv = cfg.cv, B = cfg.box, M = cfg.meta || SPIN
    var FRONT = cfg.front || 'cherry', BACK = FRONT === 'cherry' ? 'pine' : 'cherry'
    var opts = { premultipliedAlpha: true, alpha: true, antialias: false }
    var gl = cv.getContext('webgl2', opts) || cv.getContext('webgl', opts)
    if (!gl) return null
    var gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
    var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
    var prec = hp && hp.precision > 0 ? 'highp' : 'mediump'
    var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'
    var FS = 'precision ' + prec + ' float;\n' +
      'varying vec2 v;\n' +
      'uniform sampler2D uC,uP,uG;\n' +
      'uniform vec2 uTex,uBox,uPiv,uCen,uRot,uE;\n' +
      'uniform float uK,uA,uBlur,uRb;\n' +
      'const float PI=3.14159265;\n' +
      'const float LIM=1.2915;\n' +
      'vec2 geo(float y){vec4 g=texture2D(uG,vec2(.5,(clamp(floor(y+.5),0.,uTex.y-1.)+.5)/uTex.y));return vec2(g.r*65280.+g.g*255.,g.b*65280.+g.a*255.)/64.;}\n' +
      'float wrapA(float a){return a-2.*PI*floor((a+PI)/(2.*PI));}\n' +
      'vec3 samp(sampler2D s,float loc,float h,float E,float over){float yv=h-E*cos(loc);vec2 g=geo(yv);float xv=g.x+g.y*(sin(loc)+over);return texture2D(s,(vec2(xv,yv)+.5)/uTex,-.5).rgb;}\n' +
      'vec3 look(float a,float phi,float h,float E,float over,float deg){\n' +
      '  float psi=wrapA(phi+a);\n' +
      '  float lim=max(LIM,abs(phi));\n' +
      '  float t=clamp((abs(psi)-lim)/max(PI-2.*lim,1e-3),0.,1.);t=t*t*(3.-2.*t);\n' +
      '  t=mix(t,clamp(.5-cos(a)*5.,0.,1.),deg);\n' +
      '  float lc=clamp(psi,-lim,lim);\n' +
      '  float lp=clamp(wrapA(psi-PI),-lim,lim);\n' +
      '  vec3 col=mix(samp(uC,lc,h,E,over),samp(uP,lp,h,E,over),t);\n' +
      '  float loc=t<.5?lc:lp;\n' +
      '  float k=.55*clamp(smoothstep(.8,.995,abs(sin(phi)))-smoothstep(.8,.995,abs(sin(loc))),0.,1.);\n' +
      '  return 1.-(1.-col)*(1.-k*vec3(.93,.94,.96));\n' +
      '}\n' +
      'void main(){\n' +
      '  vec2 q=vec2(v.x,1.-v.y)*uBox-uPiv;\n' +
      '  vec2 t=vec2(uRot.x*q.x-uRot.y*q.y,uRot.y*q.x+uRot.x*q.y)*uK+uCen;\n' +
      '  float inside=step(-1.,t.x)*step(-1.,t.y)*step(t.x,uTex.x)*step(t.y,uTex.y);\n' +
      '  float al=texture2D(uC,(t+.5)/uTex,-.5).a*inside;\n' +
      '  vec2 g=geo(t.y);\n' +
      '  float sr=(t.x-g.x)/max(g.y,.5);\n' +
      '  float sc=clamp(sr,-1.,1.);\n' +
      '  float phi=asin(sc),over=sr-sc,deg=step(.9995,abs(sr));\n' +
      '  float E=uRb*mix(uE.x,uE.y,clamp(t.y/uTex.y,0.,1.));\n' +
      '  float h=t.y+E*cos(phi);\n' +
      '  vec3 col;\n' +
      '  if(uBlur<.0005) col=look(uA,phi,h,E,over,deg);\n' +
      '  else{col=vec3(0.);for(int i=0;i<9;i++)col+=look(uA+uBlur*(float(i)/8.-.5),phi,h,E,over,deg);col/=9.;}\n' +
      '  gl_FragColor=vec4(clamp(col,0.,1.)*al,al);\n' +
      '}'
    function sh (type, src) {
      var o = gl.createShader(type)
      gl.shaderSource(o, src)
      gl.compileShader(o)
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null }
      return o
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return null
    var pr = gl.createProgram()
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null
    gl.useProgram(pr)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    var ap = gl.getAttribLocation(pr, 'p')
    gl.enableVertexAttribArray(ap)
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0)
    function U (n) { return gl.getUniformLocation(pr, n) }
    function tex (unit, upload, min, mag) {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
      upload()
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag)
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    ;[imC, imP].forEach(function (im, i) {
      tex(i, function () {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im)
        if (gl2) gl.generateMipmap(gl.TEXTURE_2D)
      }, gl2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR, gl.LINEAR)
    })
    var geo = Uint8Array.from(atob(M.geo), function (c) { return c.charCodeAt(0) })
    tex(2, function () { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, M.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, geo) }, gl.NEAREST, gl.NEAREST)
    gl.uniform1i(U('uC'), 0); gl.uniform1i(U('uP'), 1); gl.uniform1i(U('uG'), 2)
    gl.uniform2f(U('uTex'), M.w, M.h); gl.uniform2f(U('uBox'), B.w, B.h); gl.uniform2f(U('uPiv'), B.px, B.py)
    gl.uniform2f(U('uCen'), M.cen[0], M.cen[1]); gl.uniform2f(U('uRot'), Math.cos(B.tilt), -Math.sin(B.tilt))
    gl.uniform2f(U('uE'), M.e[0], M.e[1]); gl.uniform1f(U('uK'), B.k); gl.uniform1f(U('uRb'), M.body)
    var uA = U('uA'), uBlur = U('uBlur')
    if (gl.getError() !== gl.NO_ERROR) return null

    var ang = cfg.want() === BACK ? Math.PI : 0, vel = 0, tgt = ang, raf = 0, prev = 0

    function draw (blur) {
      gl.viewport(0, 0, cv.width, cv.height)
      gl.uniform1f(uA, ((ang % TAU) + TAU) % TAU)
      gl.uniform1f(uBlur, blur)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    function facing () { return Math.cos(ang) < 0 ? BACK : FRONT }
    function sync () { var f = facing(); if (cfg.host.dataset.flavor !== f) cfg.host.dataset.flavor = f }
    function settle () {
      cfg.can.style.translate = ''
      if (cfg.shadow) { cfg.shadow.style.scale = ''; cfg.shadow.style.opacity = '' }
    }
    function frame (now) {
      var dt = Math.min(.05, Math.max(.001, (now - prev) / 1000)); prev = now
      var w = 7.2, K = w * w, C = 2 * .74 * w, n = 4
      for (var i = 0; i < n; i++) { vel += (K * (tgt - ang) - C * vel) * dt / n; ang += vel * dt / n }
      sync()
      if (Math.abs(tgt - ang) < .0008 && Math.abs(vel) < .03) { ang = tgt; vel = 0; draw(0); settle(); raf = 0; return }
      var lift = Math.min(1, Math.abs(vel) / 9)
      cfg.can.style.translate = '0 ' + (-cfg.lift() * lift).toFixed(2) + 'px'
      if (cfg.shadow) {
        cfg.shadow.style.scale = (1 - .2 * lift).toFixed(3)
        cfg.shadow.style.opacity = (cfg.shadowOp * (1 - .4 * lift)).toFixed(3)
      }
      draw(Math.min(.14, Math.abs(vel) / 60 * .8))
      raf = requestAnimationFrame(frame)
    }

    return {
      to: function (f, instant) {
        var want = f === BACK ? Math.PI : 0
        var d = (((want - tgt) % TAU) + TAU) % TAU
        if (d > 1e-4) tgt += d // always keep turning the same way
        if (instant || reduce) {
          if (raf) cancelAnimationFrame(raf)
          raf = 0; ang = tgt; vel = 0; sync(); settle(); draw(0)
          return
        }
        if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame) }
      },
      resize: function () {
        var d = Math.min(2, window.devicePixelRatio || 1)
        var sc = cfg.scale()
        if (!sc) return
        var cw = Math.max(1, Math.round(B.w * sc * d)), ch = Math.max(1, Math.round(B.h * sc * d))
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch }
        if (!raf) draw(0)
      }
    }
  }

  function initCanGL (cfg, done) {
    var src = cfg.tex, key = src.join('|')
    if (!texCache[key]) texCache[key] = Promise.all(src.map(loadImg))
    texCache[key].then(function (ims) {
      var g = null
      try { g = makeCanGL(cfg, ims[0], ims[1]) } catch (e) { console.warn(e) }
      if (!g) return
      done(g)
      g.resize()
      cfg.host.classList.add('gl')
      cfg.cv.addEventListener('webglcontextlost', function () { done(null); cfg.host.classList.remove('gl') })
      window.addEventListener('resize', function () { g.resize() })
    }).catch(function () {})
  }

  function whenNear (el, fn) {
    if (!el) return
    if (!('IntersectionObserver' in window)) { fn(); return }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting })) { io.disconnect(); fn() }
    }, { rootMargin: '1400px 0px' })
    io.observe(el)
  }

  window.DeCanGL = { initCanGL: initCanGL, whenNear: whenNear, SPIN: SPIN, ING_SPIN: ING_SPIN }
})()
