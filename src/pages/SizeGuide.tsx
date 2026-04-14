import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SizeGuide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-6xl">
          <h1 className="text-4xl font-bold mb-8">Size Guide</h1>
          
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-6">Clothing Sizes</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Chest (inches)</TableHead>
                      <TableHead>Waist (inches)</TableHead>
                      <TableHead>Hips (inches)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">XS</TableCell>
                      <TableCell>32-34</TableCell>
                      <TableCell>24-26</TableCell>
                      <TableCell>34-36</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">S</TableCell>
                      <TableCell>34-36</TableCell>
                      <TableCell>26-28</TableCell>
                      <TableCell>36-38</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">M</TableCell>
                      <TableCell>36-38</TableCell>
                      <TableCell>28-30</TableCell>
                      <TableCell>38-40</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">L</TableCell>
                      <TableCell>38-40</TableCell>
                      <TableCell>30-32</TableCell>
                      <TableCell>40-42</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">XL</TableCell>
                      <TableCell>40-42</TableCell>
                      <TableCell>32-34</TableCell>
                      <TableCell>42-44</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-6">Shoe Sizes</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>US</TableHead>
                      <TableHead>UK</TableHead>
                      <TableHead>EU</TableHead>
                      <TableHead>CM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">6</TableCell>
                      <TableCell>5.5</TableCell>
                      <TableCell>39</TableCell>
                      <TableCell>24</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">7</TableCell>
                      <TableCell>6.5</TableCell>
                      <TableCell>40</TableCell>
                      <TableCell>25</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">8</TableCell>
                      <TableCell>7.5</TableCell>
                      <TableCell>41</TableCell>
                      <TableCell>26</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">9</TableCell>
                      <TableCell>8.5</TableCell>
                      <TableCell>42</TableCell>
                      <TableCell>27</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">10</TableCell>
                      <TableCell>9.5</TableCell>
                      <TableCell>43</TableCell>
                      <TableCell>28</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SizeGuide;
